<https://lev-web-1011986942225.us-central1.run.app>

LEV_API_SEND_AUDIO_URL=<https://lev-web-1011986942225.us-central1.run.app/api/audio_upload>

NEXT_PUBLIC_AGENT_SERVER_URL=<https://levbot-1011986942225.us-central1.run.app/save_audio/>

NEXT_PUBLIC_SOCKET_SERVER_URL=<https://lev-server-1011986942225.us-central1.run.app>

docker pull docker.io/fernandomarca/lev-web
docker pull docker.io/fernandomarca/lev-server
docker pull docker.io/fernandomarca/levbot

docker tag dfdfdf us.gcr.io/key-project/web
docker tag dfdfdf us.gcr.io/key-project/server
docker tag dfdfdf us.gcr.io/key-project/levbot

docker push us.gcr.io/key-project/web
