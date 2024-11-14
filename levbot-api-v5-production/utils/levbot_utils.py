import openai
import json
import re
from dotenv import load_dotenv, find_dotenv
import time
import io  # Add this for in memory audio processing
import os  # Add this for file operations
import warnings
import random
import logging
from jsonschema import validate, ValidationError

from utils.perfil_json import (
    atualizar_e_salvar,
    gravar_log,
    verificar_approved,
    salvar_conversa,
    update_match_json,
)

from utils.metrics_utils import verificar_match


# Create a logger instance for the current module.
logger = logging.getLogger(
    __name__
)  # This allows for more granular control of logging within this module.


# Load environment variables from .env file
_ = load_dotenv(find_dotenv())


warnings.filterwarnings(
    "ignore", message="FP16 is not supported on CPU; using FP32 instead"
)

# Set your OpenAI API key from environment variable
openai.api_key = os.environ["OPENAI_API_KEY"]

# Initialize OpenAI client
client = openai.OpenAI()

model_version = ["gpt-4", "gpt-3.5-turbo"]
model = model_version[0]


def levbot_verificar_info(topic, resposta_cliente, valor_esperado):
    """
    Extrai a informação do atributo especificado na resposta do cliente,
    compara com o valor esperado e retorna um JSON com o resultado.
    """
    example_json = {
        "nome_completo": [
            {
                "valor_extraido": "João da Silva",
                "valor_esperado": "João da Silva",
                "status": "approved",
                "detalhes": "Os valores são iguais",
            }
        ]
    }

    system_message = f"""
    Você é um assistente que fornece uma saída JSON válida.

    **Tarefa:**

    Analisar a resposta do usuário "{resposta_cliente}", extrair a informação 
    correspondente ao atributo especificado "{topic}" e compará-la com um valor fornecido "{valor_esperado}".
    
    **Entrada:**

    1. `topico`: O nome do atributo a ser extraído da resposta do usuário que pode ser "nome_completo", "rg", "data_nascimento", "nome_do_banco", "numero_solicitacao" ou "valor_solicitado".
    2. `resposta_cliente`: O texto contendo a resposta do usuário, onde a informação do atributo deve ser encontrada.
    3. `valor_esperado`: O valor a ser comparado com a informação extraída.

    **Saída:**

    Provide a valid JSON output com quatro colunas ** Não adicionar nenhum texto extra.

    ```json
    {{
      "{topic}": {{
        "valor_extraido": "informacao_extraida_da_resposta {resposta_cliente}, "" caso não consigo extrair a informação da resposta do usuário (como string)",
        "valor_esperado": "valor_fornecido_para_comparacao {valor_esperado} (como string)",
        "status": "approved" ou "pending",
        "detalhes": "descrição da comparação (ex: 'Valores iguais' ou 'Valores distintos') (como string)"
        }}
      }}
    ```
    """

    messages = [
        {
            "role": "system",
            "content": system_message
            + ". Provide an output in valid JSON. The data scheme should\
         be like this: "
            + json.dumps(example_json),
        },
        {"role": "user", "content": resposta_cliente},
    ]

    response = openai.chat.completions.create(
        model="gpt-4", messages=messages, max_tokens=300, temperature=0.0
    )

    response_content = response.choices[0].message.content

    try:
        json_response = json.loads(response_content)
    except json.JSONDecodeError:
        print(f"Erro: A resposta do modelo não é um JSON válido: {response_content}")
        json_response = response_content  # Mantém a resposta original como string

    return json_response  # Movido para fora do try-except


def levbot_response(topic, context=None):
    """Você é um agente online da Lev entrevistando um usuário que realizou um pedido de empréstimo.
    Sua tarefa é gerar perguntas claras e concisas para verificar os dados do usuário, com base no tópico fornecido.
    """
    model_version = ["gpt-4", "gpt-3.5-turbo"]

    if context is None:
        context = {"valor": "", "verified": False, "status": "pending", "tentativas": 0}

    if topic == "cliente_aprovado":
        # Retornar mensagem de aprovação com variações
        mensagens_aprovacao = [
            f"""Parabéns {context["valor"]}! Todas as suas informações foram verificadas com sucesso e você está aprovado. A ligação será finalizada agora. Muito obrigado!""",
            f"""Que notícia incrível, {context["valor"]}! Você foi aprovado. Agradecemos a sua paciência durante a verificação.  A ligação será finalizada agora. Tenha um ótimo dia!""",
            f"""Sucesso, {context["valor"]}!  Após uma análise cuidadosa, temos o prazer de informar que você foi aprovado. A ligação será finalizada agora.  Obrigado por escolher a Lev!""",
        ]
        return random.choice(mensagens_aprovacao)

    else:
        # Construir a mensagem com base no status e tentativas
        if context["status"] == "approved":
            context = (
                "Sua resposta foi verificada e você passou para a próxima pergunta."
            )
        elif context["tentativas"] == 0:
            context = "Você tem 2 tentativas para responder a esta pergunta."
        elif context["tentativas"] == 1:
            context = "Você tem mais uma tentativa para responder a esta pergunta."

        elif context["status"] == "rejected":  # Adicionando a condição para "rejected"
            mensagens_rejeicao = [
                "Infelizmente, não foi possível validar suas informações. Um de nossos atendentes entrará em contato para auxiliar.",
                "Houve um problema na verificação dos seus dados. Para que possamos prosseguir, vou transferir você para um atendente.",
                "Parece que encontramos algumas inconsistências nas informações fornecidas. Não se preocupe, vou encaminhar você para um especialista que poderá te ajudar.",
            ]
            return random.choice(mensagens_rejeicao)

    system_message = f"""
    Você é um agente online da Lev entrevistando um usuário que realizou um pedido de empréstimo.
    Sua tarefa é gerar perguntas claras, concisas e personalizadas para verificar os dados do usuário, com base no tópico fornecido.

    Tópico: {topic}

    Instruções:
    * Adote um tom amigável e profissional, como se estivesse em uma conversa casual.
    * NÃO INICIE A PERGUNTA COM SAUDAÇÕES, pois a conversa já está em andamento.
    * Explique a necessidade de verificar os dados do usuário de forma transparente e gentil.
    * Se o contexto for fornecido, utilize-o para formular perguntas mais relevantes e personalizadas, mostrando que você está atento ao que o usuário já disse.
    * Varie o estilo das perguntas para tornar a conversa mais dinâmica e interessante.
    * Exemplos de perguntas:
        * "Para que possamos prosseguir com a análise do seu pedido, você poderia confirmar seu nome completo, por favor?"
        * "Entendi. Agora, para garantir que tudo esteja correto em nosso sistema, qual é o número do seu RG?"
        * "Perfeito! Para finalizar a verificação dos seus dados, qual seria a sua data de nascimento?"

    Contexto: {context if context else "Nenhum contexto fornecido."}

    Responda apenas com a pergunta gerada.
    """

    messages = [{"role": "system", "content": system_message}]

    response = openai.chat.completions.create(
        model=model_version[0], messages=messages, max_tokens=300, temperature=0.7
    )

    # Remove saudações da resposta usando expressão regular
    pergunta_sem_saudacao = re.sub(
        r"^(Olá|Oi|Bom dia|Boa tarde|Boa noite),?\s*",
        "",
        response.choices[0].message.content.strip(),
        flags=re.IGNORECASE,
    )

    return pergunta_sem_saudacao


# verified é se o robo ja enviou a pergunta antes.
def proxima_pergunta(
    token_call,
    dados_verificacao,
    dados_perfil,
    atributos,
    resposta_entrevistado="",
    record_log=False,
):
    """
    Determina a próxima pergunta a ser feita com base nos dados de verificação.

    Args:
      dados_verificacao (dict): Um dicionário contendo os dados de verificação do cliente.

    Returns:
      str: O nome do atributo que precisa ser verificado, ou None se todos os atributos
           já foram verificados.
    """
    max_attempts = 2
    token = token_call
    # log_path = "log_" + token + ".json"
    for atributo in atributos:
        dados_atributo = dados_verificacao["videocall"]["entrevistado"][atributo]
        dados_atributo_perfil = dados_perfil["videocall"]["entrevistado"][atributo]
        # Verifica se o valor está vazio, se não está verificado,
        # se o status é "pendente" e se há menos de duas tentativas
        if (
            dados_atributo["valor"] == ""
            and not dados_atributo["verified"]
            and dados_atributo["status"] == "pending"
            and dados_atributo["tentativas"] < max_attempts
        ):
            # dados_atributo["tentativas"] += 1
            atualizar_e_salvar(dados_verificacao, atributo, "")
            # response = "Você poderia me dizer o seu " + atributo + "?"
            response = levbot_response(
                atributo, dados_verificacao["videocall"]["entrevistado"][atributo]
            )
            salvar_conversa(token, "user", resposta_entrevistado)
            salvar_conversa(token, "system", response)
            # print(response)
            return response

        elif (  # Primeira resposta
            dados_atributo["valor"] == ""
            and dados_atributo["verified"]
            and dados_atributo["status"] == "pending"
            and dados_atributo["tentativas"] < max_attempts
        ):
            dados_atributo["tentativas"] += 1
            response_gpt = levbot_verificar_info(
                atributo, resposta_entrevistado, dados_atributo_perfil
            )
            ###
            verificar_matching = verificar_match(
                response_gpt[atributo]["valor_extraido"],
                response_gpt[atributo]["valor_esperado"],
            )
            ###
            # if response_gpt[atributo]["status"] == "approved":
            if json.loads(verificar_matching)["outcome"] == True:
                update_match_json(token, verificar_matching)
                atualizar_e_salvar(
                    dados_verificacao,
                    atributo,
                    response_gpt[atributo]["valor_extraido"],
                    # status=response_gpt[atributo]["status"],
                    status="approved",
                )
                if record_log:
                    gravar_log(
                        token,
                        atributo + " approved",
                        json.loads(json.dumps(response_gpt)),
                    )
                # response = (
                #     "Muito Obrigado!"
                #     + " Status = "
                #     + response_gpt[atributo]["status"]
                #     + "."
                # )
                # print(response)

            else:
                atualizar_e_salvar(dados_verificacao, atributo, "")
                if record_log:
                    gravar_log(
                        token,
                        atributo + " pending",
                        json.loads(json.dumps(response_gpt)),
                    )

                if dados_atributo["tentativas"] < max_attempts:
                    response = (
                        "Você poderia informar o seu "
                        + atributo
                        + " novamente?"
                        + "Status = "
                        + response_gpt[atributo]["status"]
                        + "."
                    )
                    response = levbot_response(
                        atributo,
                        dados_verificacao["videocall"]["entrevistado"][atributo],
                    )
                    salvar_conversa(token, "user", resposta_entrevistado)
                    salvar_conversa(token, "system", response)
                    # print(response)
                    return response

        if (
            dados_atributo["tentativas"] >= max_attempts
            and dados_atributo["status"] >= "pending"
        ):  # Atingiu o limite de tentativas
            dados_atributo["status"] = "rejected"
            if record_log:
                gravar_log(
                    token,
                    dados_atributo["status"],
                    json.loads(
                        json.dumps(
                            dados_verificacao["videocall"]["entrevistado"][atributo]
                        )
                    ),
                )
            atualizar_e_salvar(
                dados_verificacao,
                atributo,
                "",
                status=dados_atributo["status"],
                videocall_status="finalizado",
            )
            response = levbot_response(
                atributo, dados_verificacao["videocall"]["entrevistado"][atributo]
            )
            salvar_conversa(token, "user", resposta_entrevistado)
            salvar_conversa(token, "system", response)
            return response
            # break

        if verificar_approved(dados_verificacao) == len(
            dados_verificacao["videocall"]["entrevistado"]
        ):
            mensagem_final = levbot_response(
                "cliente_aprovado",
                dados_verificacao["videocall"]["entrevistado"]["nome_completo"],
            )
            salvar_conversa(token, "user", resposta_entrevistado)
            salvar_conversa(token, "system", mensagem_final)
            # print(mensagem_final)
            return mensagem_final

    return None  # Todos os atributos foram verificados ou rejeitados


def levbot_manager(transcription_, log_perguntas_respostas):
    """
    Extrai a informação do atributo especificado na resposta do cliente,
    compara com o valor esperado e retorna um JSON com o resultado.
    """
    logger.info(
        f"Iniciando levbot_manager com transcrição: {transcription_} e log: {log_perguntas_respostas}"
    )

    # Define o esquema JSON para validação
    schema = {
        "type": "object",
        "properties": {
            "contexto": {
                "type": "object",
                "properties": {
                    "ultima_pergunta": {"type": "string"},
                    "ultima_resposta_cliente": {"type": "string"},
                    "status": {"type": "string"},
                    "tentativas": {"type": "string"},
                    "detalhes": {"type": "string"},
                    "transcription": {"type": "string"},
                },
                "required": [
                    "ultima_pergunta",
                    "ultima_resposta_cliente",
                    "status",
                    "tentativas",
                    "detalhes",
                    "transcription",
                ],
            }
        },
        "required": ["contexto"],
    }

    system_message = f"""
    Você é um assistente que fornece uma saída JSON válida.
    Retorne APENAS um objeto JSON com a estrutura especificada abaixo *** sem nenhum texto explicativo ***
    
    Formate a "ultima_resposta_cliente" da seguinte forma:
    
    * **Data de nascimento:**
        * Converta a data de nascimento para o formato AAAA-MM-DD (ex: 1987-01-01).
        * **Siga estas etapas para identificar e formatar a data:**
            1. **Procure por palavras-chave:** Identifique a data de nascimento na transcrição procurando por palavras-chave como "nasci", "nascimento", "data de nascimento".
            2. **Isole a data:** Remova qualquer informação adicional na frase que não seja a data em si.
            3. **Converta a data:** Converta a data para o formato AAAA-MM-DD, considerando as seguintes regras:
                * **Números por extenso:** Converta números por extenso ("um", "primeiro", "vinte") para números ("1", "1", "20").
                * **Abreviações:** Converta abreviações ("1º", "10º", "jan") para o formato completo ("1", "10", "janeiro").
                * **Ordens diferentes:** Reorganize os elementos da data (dia, mês, ano) para a ordem AAAA-MM-DD.
                * **Anos abreviados:** Converta anos abreviados ("87") para o formato completo ("1987").
            4. **Formate a data:** Formate a data no formato AAAA-MM-DD, utilizando hífens como separadores.
        * **Exemplos específicos:**
            * "Eu nasci em 1º de janeiro de 1987." -> "1987-01-01"
            * "Minha data de nascimento é primeiro/01/87" -> "1987-01-01"
            * "nascimento 1 de jan de 1987" -> "1987-01-01"
            * "nasci em primeiro de janeiro de 87" -> "1987-01-01"
            * "01/01/1987" -> "1987-01-01"
            * "1 de janeiro de 1987" -> "1987-01-01"
            * "1º de janeiro de 1987" -> "1987-01-01"
            * "10 de janeiro de 1987" -> "1987-01-10"
            * "primeiro de janeiro de 1987" -> "1987-01-01"
            * "décimo de janeiro de 1987" -> "1987-01-01"
            * "1 de janeiro de oitenta e sete" -> "1987-01-01"
            * "um do um de oitenta e sete" -> "1987-01-01"
            * "nascido em 01-01-1987" -> "1987-01-01"
        
    * **Nome do Banco:**
        * Inclua todos os bancos do Brasil.
        * Renomeie os bancos para o nome completo, como:
            * Safra -> Banco Safra
            * Itaú -> Banco Itaú
            * Santander -> Banco Santander
            * Bradesco -> Banco Bradesco
            * Caixa -> Caixa Econômica Federal
            * Banco do Brasil -> Banco do Brasil
            * Nubank -> Nubank
            * Inter -> Banco Inter
            * C6 Bank -> C6 Bank
            * Original -> Banco Original
            * Neon -> Neon
            * Pan -> Banco Pan
            * Daycoval -> Banco Daycoval
            * Nordeste -> Banco do Nordeste
            * Amazônia -> Banco da Amazônia
            * ... e outros bancos relevantes
            
    * **Valor Solicitado:**
        * Extraia o valor solicitado, convertendo números por extenso ("um", "dez", "milhão") para numéricos.
        * Remova "reais", "centavos", "R$", etc.
        * Formate o valor final como "XXXX.XX" (com duas casas decimais e ponto decimal).
        * Exemplos:
            * "10 mil reais" -> "10000.00"
            * "R$ 10.000,00" -> "10000.00"
            * "dez mil duzentos e noventa reais e 50 centavos" -> "10290.50" 
            * "um milhão e meio de reais" -> "1500000.00"
            * "quatrocentos e oitenta e sete mil, novecentos e doze reais" -> "487912.00"
            
    * **Número de Solicitação:**
        * Se o cliente fornecer um número de solicitação, extraia apenas os números, removendo espaços, hífens, pontos, barras ou qualquer outro símbolo que não seja numérico.
        * Por exemplo:
            * "É número de solicitação 1, 2, 3, 4, 5." -> "12345"
            * "O número é 987-654-321" -> "987654321"
            * "Minha solicitação é a de número 12.345/67" -> "1234567"
            * "Solicitação número 001 234 567 890" -> "001234567890"
            * "É o número 12345 com código 67890" -> "1234567890" (se ambos forem números de solicitação)

    Estrutura JSON:
    ```json
    {{
      "contexto": {{
        "ultima_pergunta": "Última pergunta feita pelo agente, extraída de {log_perguntas_respostas}.",
        "ultima_resposta_cliente": "Última resposta do cliente, extraída de {transcription_}.",
        "status": "true ou false, indicando se a última pergunta do agente ('ultima_pergunta') foi respondida corretamente pelo cliente ('ultima_resposta_cliente') na transcrição (como string).",
        "tentativas": "número de tentativas de resposta do cliente (como string)",
        "detalhes": "descrição da análise da transcrição em relação à última pergunta (como string)",
        "transcription": "{transcription_} (como string)",
      }}
    }}
    ```
    """

    messages = [
        {
            "role": "system",
            "content": system_message,
        },
        {
            "role": "user",
            "content": f" Gere o JSON com base na transcrição: {transcription_} e no Log de perguntas e respostas: {log_perguntas_respostas}",
        },
    ]

    max_tentativas = 5
    tentativa = 1

    while tentativa <= max_tentativas:
        try:
            response = openai.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=messages,
                max_tokens=3000,
                temperature=0.0,
                response_format={"type": "json_object"},
            )
            logger.info("Resposta do GPT-4 recebida com sucesso.")

            response_content = response.choices[0].message.content

            # Explicitly convert to dictionary if it's a string
            if isinstance(response_content, str):
                json_response = json.loads(response_content)
            else:
                json_response = response_content

            # Directly validate the JSON structure
            validate(instance=json_response, schema=schema)
            logger.info("JSON validado com sucesso.")
            return json_response  # Return valid JSON immediately

        except (json.JSONDecodeError, ValidationError) as e:
            tentativa += 1
            logger.warning(
                f"Tentativa {tentativa}/{max_tentativas}: JSON inválido ({e}). Executando levbot_manager novamente."
            )

    logger.error(
        f"Número máximo de tentativas ({max_tentativas}) excedido. Falha ao gerar JSON válido."
    )
    return {"error": "Falha ao gerar JSON válido"}  # Return an error object
