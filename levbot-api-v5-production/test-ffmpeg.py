# Configure logging to see detailed error messages
logging.basicConfig(level=logging.DEBUG)


@app.post("/levbot/")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    # language: str = "pt",  # Not used currently
    authorization: str = Header(None),
):
    """
    Receives an audio file, converts it to Opus using FFmpeg,
    transcribes it using Whisper-1, and returns the text.
    """

    if authorization:
        token = authorization.split(" ")[1]  # Assuming "Bearer <token>" format
        # Add your token verification logic here if needed
        print(f"Received token: {token}")
    else:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        # 1. Read the entire file contents
        file_contents = await audio_file.read()

        # 2. Create an in-memory bytes buffer for the original audio
        original_audio_buffer = io.BytesIO(file_contents)

        # 3. Convert audio to Opus using FFmpeg
        try:
            opus_buffer = io.BytesIO()
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                "-",  # Input from stdin (pipe)
                "-vn",  # Disable video
                "-acodec",
                "libopus",  # Encode audio with Opus
                "-f",
                "ogg",  # Output format Ogg Opus
                "pipe:1",  # Output to stdout (pipe)
            ]
            process = subprocess.run(
                ffmpeg_command,
                input=original_audio_buffer.read(),  # Pass original audio data to FFmpeg
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            opus_buffer.write(process.stdout)
            opus_buffer.seek(0)

            if process.returncode != 0:
                logging.error(f"FFmpeg conversion error: {process.stderr.decode()}")
                raise HTTPException(status_code=500, detail="Audio conversion failed")

        except Exception as e:
            logging.exception("Error converting audio to Opus:")
            raise HTTPException(status_code=500, detail="Audio conversion failed")

        # 4. Transcribe using Whisper-1
        transcription = await client.audio.transcriptions.create(
            model="whisper-1", file=opus_buffer  # Pass the Opus buffer
        )

        # 5. Extract the transcribed text
        transcribed_text = transcription.text

        # 6. Return the transcribed text
        return {"transcription": transcribed_text}

    except Exception as e:
        logging.exception("Error processing audio file:")
        raise HTTPException(status_code=500, detail="Error transcribing audio")


import io
import logging
import subprocess  # For running FFmpeg
from fastapi import FastAPI, File, UploadFile, Header, HTTPException


app = FastAPI()

# Configure logging to see detailed error messages
logging.basicConfig(level=logging.DEBUG)


@app.post("/levbot/")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    # language: str = "pt",  # Not used currently
    authorization: str = Header(None),
):
    """
    Receives an audio file, converts it to Opus using FFmpeg,
    transcribes it using Whisper-1, and returns the text.
    """

    if authorization:
        token = authorization.split(" ")[1]  # Assuming "Bearer <token>" format
        # Add your token verification logic here if needed
        print(f"Received token: {token}")
    else:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        # 1. Read the entire file contents
        file_contents = await audio_file.read()

        # 2. Create an in-memory bytes buffer for the original audio
        original_audio_buffer = io.BytesIO(file_contents)

        # 3. Convert audio to Opus using FFmpeg (with process.kill())
        try:
            opus_buffer = io.BytesIO()
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                "-",  # Input from stdin (pipe)
                "-vn",  # Disable video
                "-acodec",
                "libopus",  # Encode audio with Opus
                "-f",
                "ogg",  # Output format Ogg Opus
                "pipe:1",  # Output to stdout (pipe)
            ]
            process = subprocess.run(
                ffmpeg_command,
                input=original_audio_buffer.read(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30,  # Add a timeout (adjust as needed)
            )

            if process.returncode != 0:
                logging.error(f"FFmpeg conversion error: {process.stderr.decode()}")

                # Kill the process if it's still running
                if process.poll() is None:
                    process.kill()

                raise HTTPException(status_code=500, detail="Audio conversion failed")

            opus_buffer.write(process.stdout)
            opus_buffer.seek(0)

        except subprocess.TimeoutExpired:
            logging.error("FFmpeg conversion timed out")

            # Kill the process if it's still running
            if process.poll() is None:
                process.kill()

            raise HTTPException(status_code=500, detail="Audio conversion timed out")
        except Exception as e:
            logging.exception("Error converting audio to Opus:")
            raise HTTPException(status_code=500, detail="Audio conversion failed")

        # 4. Transcribe using Whisper-1
        transcription = await client.audio.transcriptions.create(
            model="whisper-1", file=opus_buffer  # Pass the Opus buffer
        )

        # 5. Extract the transcribed text
        transcribed_text = transcription.text

        # 6. Return the transcribed text
        return {"transcription": transcribed_text}

    except Exception as e:
        logging.exception("Error processing audio file:")
        raise HTTPException(status_code=500, detail="Error transcribing audio")
