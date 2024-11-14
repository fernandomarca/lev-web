# Import necessary modules from FastAPI for building the API.
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends, status, Response
# Used for returning file responses.
from fastapi.responses import FileResponse
from fastapi.middleware.cors import (
    CORSMiddleware,
)  # Enables Cross-Origin Resource Sharing.
from pydantic import BaseModel  # Used for data validation and modeling.

# Import the OpenAI library for interacting with the OpenAI API.
import openai
import warnings  # Used for handling warnings.
import requests  # Used for making HTTP requests.

# Import dotenv for loading environment variables from a .env file.
from dotenv import load_dotenv, find_dotenv
import time  # Used for time-related operations.
import io  # Used for in-memory file processing (e.g., audio).
import tempfile  # Used for creating temporary files and directories.
import os  # Used for interacting with the operating system.
import json  # Used for working with JSON data.
import uvicorn
# Commented out: Potentially used for video processing, but not currently in use.
# from moviepy.editor import VideoFileClip

# Used for creating named temporary files.
from tempfile import NamedTemporaryFile
import tempfile  # Used for creating temporary files and directories.
import logging  # Used for logging events and errors.

# Import security modules for handling authentication (likely using bearer tokens).
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Import custom modules for chatbot logic and user profile management.

from utils.levbot_utils import (
    # Function to determine the next question in the conversation.
    proxima_pergunta,
    # Main function for managing the interaction with the OpenAI API.
    levbot_manager,
)

from utils.perfil_json import (
    criar_perfil_cliente,  # Function to create a new user profile.
    criar_verificacao_cliente,  # Function to create a verification for a user.
    verificar_token,  # Function to verify user authentication tokens.
    carregar_dados_json,  # Function to load data from JSON files.
    load_json_manager,  # Function to load data for the levbot_manager.
    # Function to save the response from levbot_manager.
    save_levbot_manager_response,
)

# Configure logging to write log messages to a file named "levbot_manager.log".
logging.basicConfig(
    filename="levbot_manager.log",  # Specify the filename for the log file.
    # Set the minimum logging level to INFO (logs INFO, WARNING, ERROR, and CRITICAL messages).
    level=logging.INFO,
    # Define the format of log messages (timestamp - level - message).
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# Create a logger instance for the current module.
logger = logging.getLogger(
    __name__
)  # This allows for more granular control of logging within this module.

# Load environment variables from .env file
_ = load_dotenv(find_dotenv())

warnings.filterwarnings(
    "ignore", message="FP16 is not supported on CPU; using FP32 instead"
)

# Create a FastAPI application instance
app = FastAPI()
security = HTTPBearer()

# Define allowed origins for CORS (Cross-Origin Resource Sharing)
origins = ["*"]

# Add CORS middleware to the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Set your OpenAI API key from environment variable
openai.api_key = os.environ["OPENAI_API_KEY"]
lev_web_api = os.environ["LEV_API_SEND_AUDIO_URL"]

# Initialize OpenAI client
client = openai.OpenAI()

model_version = ["gpt-4", "gpt-3.5-turbo"]


# Root endpoint for basic health check
@app.get("/")
async def root():
    return {"message": "Hello Lev Agent API"}


# Pydantic model for request data validation
class LevRequest(BaseModel):
    input_str: str


class LevbotData(BaseModel):
    token: str
    video_call: str = ""
    call_status: str = ""
    last_chunk: bool = False


# Endpoint to handle text-based chat with Lev
@app.post("/chatLev/")
async def translate(request: LevRequest):
    try:
        output_gpt = levbot_response(request.input_str)
        print(request.input_str)  # Print user input for debugging
        return {"levagent_response": output_gpt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Function to get response from Lev chatbot
def levbot_response(input_str):
    completion = client.chat.completions.create(
        model=model_version[0],  # Use the first model in the list (gpt-4)
        messages=[
            {
                "role": "system",
                "content": "You are an agent investigating online fraud during an interview. Your objective is to verify CPF and full name. Responses should be in accordance with your role.",
            },
            {"role": "user", "content": input_str},
        ],
    )
    return completion.choices[0].message.content


def generate_audio(gpt4_response):
    """
    Generates audio from text using OpenAI's TTS API and saves it to a temporary file.

    Args:
        gpt4_response (str): The text to convert to speech.

    Returns:
        str: The path to the temporary audio file.
    """
    try:
        # Generate audio from text
        audio_response = client.audio.speech.create(
            model="tts-1", voice="onyx", input=gpt4_response
        )

        # Save the audio response to a temporary file
        with tempfile.NamedTemporaryFile(
            suffix=".mp3", delete=False
        ) as temp_audio_file:
            audio_response.stream_to_file(temp_audio_file.name)
            temp_audio_file_path = temp_audio_file.name

        return temp_audio_file_path

    except openai.error.APIError as e:
        print(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


def send_audio(temp_audio_file_path):
    """
    Sends an audio file to the specified endpoint.

    Args:
        temp_audio_file_path (str): The path to the audio file to send.
    """
    try:
        with open(temp_audio_file_path, "rb") as f:
            audio_content = io.BytesIO(f.read())

        files = {"file": ("lev-output.mp3", audio_content, "audio/mpeg")}

        response = requests.post(
            lev_web_api, files=files, verify=False
        )

        # Handle the response with more detail
        if response.status_code == 200:
            print("Audio file sent successfully!")
            try:
                result = response.json()  # Attempt to parse JSON response
                print("Server response:", result)
            except ValueError:
                print("Server response was not JSON:", response.text)
        else:
            print(f"Error sending: {response.status_code} - {response.text}")
        # Explicitly close and release the BytesIO buffer
        audio_content.close()

    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Clean up the temporary file (important!)
        if os.path.exists(temp_audio_file_path):  # Check if file exists
            os.remove(temp_audio_file_path)  # Use the correct variable


def video_to_audio(
    video_path: str, audio_file_path: str
):  # Now takes the full audio path
    """
    This function converts a video file to audio and saves it
    to the specified audio file path.

    :param video_path: The path to the video file.
    :param audio_file_path: The full path where the audio file should be saved.
    """
    try:
        # Load video file
        video = VideoFileClip(video_path)

        # Extract audio from video
        audio = video.audio

        # Save extracted audio directly as MP3 at the specified path
        audio.write_audiofile(audio_file_path, codec="mp3",
                              verbose=False, logger=None)

        # Closing the files
        video.close()

    except Exception as e:
        logger.error(f"Error converting video to audio: {e}")
        raise  # Re-raise the exception for handling in the calling function


@app.post("/convert/")
async def convert_video_to_audio(file: UploadFile = File(...)):
    if file.content_type.startswith("video/"):
        try:
            # 1. Create a temporary file
            with NamedTemporaryFile(suffix=".mp4", delete=False) as temp_video_file:
                temp_video_file.write(await file.read())
                temp_video_file_path = temp_video_file.name

            # 2. Get the current directory
            current_directory = os.getcwd()

            # 3. Generate audio file path in the current directory
            audio_file_path = os.path.join(
                current_directory, f"{file.filename.split('.')[0]}.mp3"
            )

            # 4. Convert video to audio
            logger.info(f"Converting video file: {file.filename}")
            # Pass the audio_file_path to video_to_audio
            video_to_audio(temp_video_file_path, audio_file_path)
            logger.info(f"Conversion successful: {audio_file_path}")

            # 5. Send the audio file as a response
            return FileResponse(
                audio_file_path,
                media_type="audio/mpeg",
                filename=os.path.basename(audio_file_path),
            )

        except Exception as e:
            logger.error(f"Error occurred during conversion: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"An error occurred: {str(e)}")

        finally:
            # 6. Clean up the temporary video file
            os.remove(temp_video_file_path)

    else:
        raise HTTPException(
            status_code=400, detail="Uploaded file is not a video.")


# @app.post("/save_audio/")
# async def save_audio(file: UploadFile = File(...)):
#     if file.content_type == "audio/mpeg":
#         try:
#             # 2. Generate video file path in the current directory
#             # audio_file_path = file.filename
#             audio_file_path = "output.mp3"
#             # # 3. Save the uploaded audio file
#             # while True:
#             #     chunk = await file.read()  # Read in chunks of 1MB
#             #     if not chunk:
#             #         break
#             #     with open(audio_file_path, "ab") as f:
#             #         f.write(chunk)

#             # Remove the file if it exists
#             if os.path.exists(audio_file_path):
#                 os.remove(audio_file_path)

#             # 3. Save the uploaded audio file (entire file at once)
#             contents = await file.read()  # Read the entire file contents
#             with open(audio_file_path, "wb") as f:  # Use 'wb' to write binary data
#                 f.write(contents)

#             logger.info(f"audio mp4 file saved at: {audio_file_path}")

#             return {"message": "audio mp4 file saved successfully"}

#         except Exception as e:
#             logger.error(f"Error saving audio mp4 file: {str(e)}")
#             raise HTTPException(
#                 status_code=500, detail=f"An error occurred: {str(e)}")

#     else:
#         raise HTTPException(
#             status_code=400, detail="Uploaded file is not an MP4 audio."
#         )


last_api_call_time = 0.0


@app.post("/save_audio/")
async def save_audio(file: UploadFile = File(...), authorization: str = Header(None)):
    global last_api_call_time  # Access the global variable
    current_time = time.time()
    time_since_last_call = current_time - last_api_call_time

    if time_since_last_call < 20:
        print(time_since_last_call)
        raise HTTPException(
            status_code=500, detail="API called too frequently.")

    if file.content_type == "audio/mpeg":
        try:
            last_api_call_time = time.time()

            audio_file_path = "output.mp3"

            if os.path.exists(audio_file_path):
                os.remove(audio_file_path)

            contents = await file.read()

            with open(audio_file_path, "wb") as f:  # Use 'wb' to write binary data
                f.write(contents)

            logger.info(f"audio mp4 file saved at: {audio_file_path}")

            return Response(status_code=status.HTTP_200_OK, content="Audio file saved and processed successfully")

        except Exception as e:
            logger.error(f"Error saving audio mp4 file: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"An error occurred: {str(e)}")

# try:
#     levbot_endpoint = "http://127.0.0.1:8000/levbot/"
#     levbot_response = requests.post(levbot_endpoint)

#     if levbot_response.status_code == 200:
#         print("Levbot is Ok!")
#     else:
#         print(
#             "Levbot is not Ok! {levbot_response.status_code} - {levbot_response.text}"
#         )
# except requests.RequestException as e:
#     print(f"Network error: {e}")
# except Exception as e:
#     print(f"An error occurred: {e}")
# else:
#     raise HTTPException(
#         status_code=400, detail="Uploaded file is not an MP4 audio."
#     )


@app.post("/levbot/")
async def levbot_endpoint():
    """
    Endpoint to receive video_call, call_status, and last_chunk.
    """
    # audio_file = open("output.mp4", "rb")
    audio_file = open("./output.mp3", "rb")
    try:

        token = "c4b9271a-6f05-4e09-a41a-520c16ce6205"
        topics = []

        try:
            # Check if the user's token exists. If not, create a new profile and verification.
            if not verificar_token(token):
                criar_perfil_cliente(token)
                criar_verificacao_cliente(token)

            # Transcribe the audio file using OpenAI's Whisper API.
            transcription = client.audio.transcriptions.create(
                model="whisper-1", file=audio_file, language="pt"
            )

            transcription_done = transcription.text

        except openai.error.OpenAIError as e:
            # Handle specific OpenAI API errors.
            logger.error(f"OpenAI API error: {e}")
            # Example: Return a 500 Internal Server Error with a more informative message.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transcription failed: {e}",
            )

        except Exception as e:
            # Handle other unexpected errors.
            logger.exception(
                f"An unexpected error occurred: {e}"
            )  # Log the full exception with traceback.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during transcription.",
            )

        finally:
            # Ensure the audio file is always closed, even if an error occurs.
            if audio_file:
                audio_file.close()

        # Log the transcribed text.
        logger.info(f"Transcription successful: {transcription_done}")

        # Load the JSON data containing the conversation flow (questions and answers) for this user.
        perguntas_respostas_videocall = load_json_manager(token)

        logger.debug(
            f"Loaded conversation data: {perguntas_respostas_videocall}"
        )  # Log at DEBUG level

        # Initialize levbot_manager_response with a default value or an empty dictionary.
        levbot_manager_response = {}  # or some default value

        if perguntas_respostas_videocall:
            # If conversation data exists, process the transcribed text using levbot_manager.
            logger.info(
                "JSON conversation found, processing the transcription...")

            try:
                levbot_manager_response = levbot_manager(
                    transcription_done, perguntas_respostas_videocall
                )
            except Exception as e:
                logger.exception(f"Error in levbot_manager: {e}")
                # Handle the error appropriately (e.g., return an error response)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error processing the conversation.",
                )

            # Save the response generated by levbot_manager.
            save_levbot_manager_response(levbot_manager_response, token)
            logger.debug(
                f"levbot_manager response: {levbot_manager_response}"
            )  # Log at DEBUG level

            # Check the status of the levbot_manager response.
            if levbot_manager_response["contexto"]["status"] == "true":
                # If the status is "true", extract the customer's response.
                resposta_do_cliente = levbot_manager_response["contexto"][
                    "ultima_resposta_cliente"
                ]

            else:
                # If the status is not "true", wait for the next transcription.
                logger.info("Waiting for the next transcription...")
                return {
                    "message": "Waiting for the next transcription"
                }  # Return a more informative response

        else:
            # If no conversation data is found, continue with a default response.
            logger.info("No conversation data found, using default response.")
            resposta_do_cliente = "Sim, confirmo."

        dados_perfil, dados_verificacao = carregar_dados_json(token)
        topics = [
            key for key in dados_perfil["videocall"]["entrevistado"]
            # Cria uma lista chamada "topics" com as chaves do dicionário dados_perfil["videocall"]["entrevistado"], que correspondem aos tópicos da entrevista.
        ]

        # Get Lev's response based on the transcribed text
        levbot_response = proxima_pergunta(
            token,
            dados_verificacao,
            dados_perfil,
            topics,
            resposta_do_cliente,
            record_log=True,
        )
        print(levbot_response)
        # start_time = time.time()
        # Generate audio
        temp_audio_file_path = generate_audio(levbot_response)
        # print(temp_audio_file_path)

        # Send audio to external endpoint
        send_audio(temp_audio_file_path)
        # end_time = time.time()  # Record the end time

        # Return the transcribed text and Lev's response
        return {
            "mensagem": "sucesso",
        }
    except Exception as e:
        # Handle general exceptions and raise an HTTP error
        raise HTTPException(status_code=500, detail=str(e))


# if __name__ == "__main__":
#     import uvicorn

#     uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
