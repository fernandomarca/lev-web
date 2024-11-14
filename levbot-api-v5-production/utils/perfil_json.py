import json  # Importa a biblioteca json para trabalhar com arquivos JSON
import os  # Importa a biblioteca os para interagir com o sistema operacional
import datetime
import warnings
from jsonschema import validate, ValidationError

warnings.filterwarnings(
    "ignore", message="FP16 is not supported on CPU; using FP32 instead"
)


def criar_perfil_cliente(token="12343928sdfd98329832sa"):
    """
    Cria um arquivo JSON com os dados do cliente dentro de uma pasta com o número do token.
    """

    # Dados a serem inseridos no JSON
    dados = {
        "videocall": {
            "token": token,  # Token único da videochamada
            "status": "iniciada",  # Status da videochamada (iniciada, em andamento, encerrada)
            "entrevistado": {  # Dados do entrevistado
                "nome_completo": "Jose Luis Silva",
                "rg": "0891465570",
                "data_nascimento": "1987-01-01",
                "nome_do_banco": "Banco Safra",
                "numero_solicitacao": "12345",
                "valor_solicitado": "10000.00",
            },
        }
    }

    # Cria a pasta com o número do token
    token = dados["videocall"]["token"]
    pasta_token = f"videocall_{token}"
    os.makedirs(
        pasta_token, exist_ok=True
    )  # Cria a pasta se ela não existir, sem gerar erro se já existir

    # Cria o arquivo JSON dentro da pasta
    with open(
        os.path.join(pasta_token, "videocall_perfil.json"), "w"
    ) as f:  # Abre o arquivo em modo de escrita ('w')
        json.dump(
            dados, f, indent=4
        )  # Escreve os dados no arquivo com identação para melhor legibilidade

    print(
        f"Arquivo 'videocall_perfil.json' criado com sucesso na pasta {pasta_token}!"
    )  # Mensagem de sucesso
    return token  # Retorna o token


def criar_verificacao_cliente(token="12343928sdfd98329832sa"):
    """
    Cria um arquivo JSON para controlar o processo de verificação dos dados do cliente,
    com todos os campos 'verified' definidos como False, dentro de uma pasta com o número do token.
    """

    # Dados a serem inseridos no JSON para validacao
    dados_verificacao = {
        "videocall": {
            "token": token,  # Token da videochamada (inicialmente vazio)
            "status": "",  # Status da videochamada (inicialmente vazio)
            "entrevistado": {  # Dados do entrevistado a serem verificados
                "nome_completo": {  # Estrutura para cada atributo do entrevistado
                    "valor": "",  # Valor do atributo (inicialmente vazio)
                    "verified": False,  # Indica se o atributo foi verificado
                    "status": "pending",  # Status da verificação (pending, approved, rejected)
                    "tentativas": 0,  # Número de tentativas de validação
                },
                "rg": {
                    "valor": "",
                    "verified": False,
                    "status": "pending",
                    "tentativas": 0,
                },
                "data_nascimento": {
                    "valor": "",
                    "verified": False,
                    "status": "pending",
                    "tentativas": 0,
                },
                "nome_do_banco": {
                    "valor": "",
                    "verified": False,
                    "status": "pending",
                    "tentativas": 0,
                },
                "numero_solicitacao": {
                    "valor": "",
                    "verified": False,
                    "status": "pending",
                    "tentativas": 0,
                },
                "valor_solicitado": {
                    "valor": "",
                    "verified": False,
                    "status": "pending",
                    "tentativas": 0,
                },
            },
        }
    }

    # Cria a pasta com o número do token
    token = dados_verificacao["videocall"]["token"]
    pasta_token = f"videocall_{token}"
    os.makedirs(
        pasta_token, exist_ok=True
    )  # Cria a pasta se ela não existir, sem gerar erro se já existir

    # Cria o arquivo JSON dentro da pasta
    with open(
        os.path.join(pasta_token, "videocall_verificar.json"), "w"
    ) as fver:  # Abre o arquivo em modo de escrita ('w')
        json.dump(
            dados_verificacao, fver, indent=4
        )  # Escreve os dados no arquivo com identação para melhor legibilidade

    print(
        f"Arquivo 'videocall_verificar.json' criado com sucesso na pasta {pasta_token}!"
    )  # Mensagem de sucesso


def verificar_token(token):
    """
    Verifica se a pasta com o token e os arquivos JSON existem.

    Args:
      token: O token da videochamada.

    Returns:
      True se a pasta e os arquivos existirem, False caso contrário.
    """
    pasta_token = f"videocall_{token}"
    arquivo_perfil = os.path.join(pasta_token, "videocall_perfil.json")
    arquivo_verificacao = os.path.join(pasta_token, "videocall_verificar.json")

    if (
        os.path.exists(pasta_token)
        and os.path.exists(arquivo_perfil)
        and os.path.exists(arquivo_verificacao)
    ):
        # print(f"A pasta {pasta_token} e os arquivos JSON existem.")
        return True  # Retorna True se a pasta e os arquivos JSON existirem
    else:
        # print(f"A pasta {pasta_token} e/ou os arquivos JSON não existem.")
        return False  # Retorna False caso contrário


def carregar_dados_json(token):
    """
    Abre a pasta com o token especificado e carrega os dados dos arquivos JSON.

    Args:
      token: O token da videochamada.

    Returns:
      Uma tupla contendo os dados do perfil do cliente e os dados de verificação do cliente.
    """

    pasta_token = f"videocall_{token}"
    arquivo_perfil = os.path.join(pasta_token, "videocall_perfil.json")
    arquivo_verificacao = os.path.join(pasta_token, "videocall_verificar.json")

    try:
        with open(arquivo_perfil, "r") as fperfil:
            dados_perfil = json.load(fperfil)

        with open(arquivo_verificacao, "r") as fverificacao:
            dados_verificacao = json.load(fverificacao)

        return dados_perfil, dados_verificacao

    except FileNotFoundError:
        print(f"Pasta ou arquivos JSON não encontrados para o token {token}.")
        return None, None


def atualizar_e_salvar(
    dados_verificacao,
    atributo,
    novo_valor,
    verificado=True,
    status="pending",
    videocall_status="em andamento",
):
    """
    Atualiza os dados de verificação com o novo valor e salva em um arquivo JSON.

    Args:
      dados_verificacao (dict): Dicionário com os dados de verificação do cliente.
      atributo (str): Nome do atributo a ser atualizado.
      novo_valor (str): Novo valor para o atributo.
      verificado (bool): Indica se o atributo foi verificado (padrão: True).
      status (str): Novo status do atributo (padrão: "pending").
    """
    try:
        dados_atributo = dados_verificacao["videocall"]["entrevistado"][atributo]
        dados_atributo["valor"] = novo_valor
        dados_atributo["verified"] = verificado
        dados_atributo["status"] = status
        dados_verificacao["videocall"]["status"] = videocall_status
        # Cria a pasta com o número do token
        token = dados_verificacao["videocall"]["token"]
        pasta_token = f"videocall_{token}"
        # Cria o arquivo JSON dentro da pasta
        with open(
            os.path.join(pasta_token, "videocall_verificar.json"), "w", encoding="utf-8"
        ) as fver:  # Abre o arquivo em modo de escrita ('w')
            json.dump(
                dados_verificacao, fver, indent=4, ensure_ascii=False
            )  # Escreve os dados no arquivo com identação para melhor legibilidade

        print(
            f"Arquivo 'videocall_verificar.json' atualizado com sucesso na pasta {pasta_token}!"
        )  # Mensagem de sucesso

    except FileNotFoundError:
        print(f"Arquivo JSON não encontrado: {caminho_arquivo}")
    except KeyError:
        print(f"Erro ao acessar atributo: {atributo}")


def gravar_log(token, evento, dados=None):
    """
    Grava um evento de log em um arquivo JSON.

    Args:
      arquivo_log: Caminho para o arquivo JSON de log.
      evento: Descrição do evento que está sendo registrado.
      dados: Dicionário opcional com dados adicionais a serem incluídos no log.
    """
    pasta_token = f"videocall_{token}"
    arquivo_log = os.path.join(pasta_token, "videocall_log_" + token + ".json")

    try:
        with open(arquivo_log, "r") as f:  # Tenta abrir o arquivo em modo leitura
            log_data = json.load(f)  # Carrega os dados do arquivo, se ele existir
    except FileNotFoundError:  # Se o arquivo não for encontrado
        log_data = []  # Inicializa log_data como uma lista vazia

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    # Criar entrada de log com timestamp
    entrada_log = {
        "timestamp": timestamp,
        "evento": evento,
    }
    if dados:
        entrada_log["dados"] = dados

    log_data.append(entrada_log)

    # with open(arquivo_log, "w") as f:
    #     json.dump(log_data, f, indent=4)
    # Abre o arquivo em modo escrita para salvar os dados atualizados
    with open(arquivo_log, "w", encoding="utf-8") as f:  # Add encoding='utf-8'
        json.dump(log_data, f, indent=4, ensure_ascii=False)  # Add ensure_ascii=False


def verificar_approved(dados_verificacao):
    """
    Gera um vetor a partir do dicionário com 1 para "approved" e 0 para outros status.

    Args:
      dados_verificacao (dict): Um dicionário contendo os dados de verificação.

    Returns:
      list: Um vetor com 1 para "approved" e 0 para outros status.
    """

    vetor_status = []
    # Carregar o JSON a partir da string
    dados = json.loads(json.dumps(dados_verificacao))

    # Iterar pelos valores do dicionário
    for atributo, dados_atributo in dados["videocall"]["entrevistado"].items():
        if dados_atributo["status"] == "approved":
            vetor_status.append(1)
        else:
            vetor_status.append(0)
    return sum(vetor_status)


def salvar_conversa(token, speaker, content):
    """
    Salva uma pergunta ou resposta em um arquivo JSON de conversa com timestamp,
    criando o arquivo se ele não existir.

    Args:
      token: O token da conversa.
      speaker: Quem fez a pergunta ou resposta ('user' ou 'levbot').
      content: O texto da pergunta ou resposta.
      is_question: Indica se o conteúdo é uma pergunta (True) ou resposta (False).
    """
    pasta_token = f"videocall_{token}"
    arquivo_json = os.path.join(pasta_token, "videocall_conversa_" + token + ".json")

    try:
        with open(arquivo_json, "r", encoding="utf-8") as f:
            conversa_json = json.load(f)
    except FileNotFoundError:
        # Inicializa a estrutura do JSON com o token
        conversa_json = {"videocall": {"token": token, "conversa": []}}

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    entrada = {"timestamp": timestamp, "role": speaker}
    # Remove a barra invertida do conteúdo
    content = content.replace("\\", "")

    entrada["context"] = content

    # Adiciona a entrada na lista "conversa"
    conversa_json["videocall"]["conversa"].append(entrada)

    with open(arquivo_json, "w", encoding="utf-8") as f:
        json.dump(conversa_json, f, indent=4, ensure_ascii=False)


def load_json_manager(token):
    """
    Checks if a JSON file exists for a given token and loads it into a dictionary.
    If the file doesn't exist, it continues without loading.

    Args:
      token: The token used to construct the folder and filename.

    Returns:
      A dictionary containing the JSON data if the file exists, otherwise None.
    """
    folder_name = f"videocall_{token}"
    filename = f"videocall_conversa_{token}.json"
    file_path = os.path.join(folder_name, filename)

    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
            return data
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON format in {filename}")
            return None
    else:
        print(f"File {filename} not found in {folder_name}")
        return None


def save_levbot_manager_response(levbot_manager_response, token):
    """
    Saves the levbot_manager_response (which includes 'contexto') to a JSON file
    within the 'videocall_{token}' folder.
    If the file exists, it appends the new 'contexto' data to the existing data
    with a timestamp. Handles cases where 'contexto' might be a dictionary or
    a list of dictionaries/strings.

    Args:
      levbot_manager_response: The response from the levbot_manager function
                                 (a dictionary with a 'contexto' key).
      token: The token used to construct the folder and filename.
    """

    folder_name = f"videocall_{token}"
    filename = f"levbot_manager_responses_{token}.json"
    file_path = os.path.join(folder_name, filename)

    os.makedirs(folder_name, exist_ok=True)

    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)

            # Access the 'contexto' from the response
            new_contexto = levbot_manager_response["contexto"]

            # Add timestamp to the new contexto
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(new_contexto, dict):
                new_contexto["timestamp"] = timestamp
            elif isinstance(new_contexto, list):
                for item in new_contexto:
                    if isinstance(item, dict):
                        item["timestamp"] = timestamp
                    elif isinstance(item, str):
                        # Directly modify the string item in the list
                        new_contexto[new_contexto.index(item)] = {
                            "text": item,
                            "timestamp": timestamp,
                        }
            else:
                print(
                    f"Error: Unexpected data type for 'contexto': {type(new_contexto)}"
                )
                return

            # Append the new 'contexto' to the existing data
            existing_data["contexto"].append(new_contexto)

        else:
            # Handle the initial write to the file
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            new_contexto = levbot_manager_response["contexto"]
            if isinstance(new_contexto, dict):
                new_contexto["timestamp"] = timestamp
                existing_data = {"contexto": [new_contexto]}
            elif isinstance(new_contexto, list):
                for i, item in enumerate(new_contexto):
                    if isinstance(item, dict):
                        item["timestamp"] = timestamp
                    elif isinstance(item, str):
                        # Directly modify the string item in the list
                        new_contexto[i] = {"text": item, "timestamp": timestamp}
                existing_data = {"contexto": new_contexto}
            else:
                print(
                    f"Error: Unexpected data type for 'contexto': {type(new_contexto)}"
                )
                return

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=4)

    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {filename}")
    except Exception as e:
        print(f"Error saving levbot_manager response: {e}")


def update_match_json(token, data):
    """
    Updates a JSON file with new data within the 'videocall_{token}' folder.
    If the file exists, it loads the existing data and adds the new data below the previous entry.
    If the file doesn't exist, it creates a new file with the data as the first entry.

    Args:
        token (str): The token used to construct the folder and filename.
        data (str): A JSON string containing the data to update the file with.
    """

    folder_name = f"videocall_{token}"
    filename = f"log_match_{token}.json"
    file_path = os.path.join(folder_name, filename)

    os.makedirs(folder_name, exist_ok=True)  # Create the folder if it doesn't exist

    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)

            # Parse the JSON string data to a dictionary
            data_dict = json.loads(data)

            # Add timestamp to the new data
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            data_dict["timestamp"] = timestamp

            # Extend the existing data with the new data
            existing_data.extend([data_dict])

        else:
            # Parse the JSON string data to a dictionary
            data_dict = json.loads(data)

            # Add timestamp to the initial data
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            data_dict["timestamp"] = timestamp

            # Create a new list with the initial data
            existing_data = [data_dict]

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=4)

    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {file_path} or in the provided data")
    except Exception as e:
        print(f"Error updating JSON file: {e}")


def is_valid_json(json_data):
    """Verifica se a resposta é um JSON válido e possui a estrutura esperada."""
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
    try:
        validate(instance=json_data, schema=schema)  # Valida o JSON
        return True
    except (json.JSONDecodeError, ValidationError):
        return False
