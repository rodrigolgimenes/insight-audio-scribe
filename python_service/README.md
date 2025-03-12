
# Fast Whisper Transcription Service

Este é um serviço Python que utiliza a biblioteca fast-whisper para transcrição de áudio. O serviço recebe solicitações da Edge Function do Supabase e processa os arquivos de áudio em segundo plano.

## Requisitos

- Python 3.10+
- Supabase Project
- Docker (opcional, para containerização)

## Configuração

1. Instale as dependências:

```bash
pip install -r requirements.txt
```

2. Configure as variáveis de ambiente:

```bash
export SUPABASE_URL=https://your-project-id.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Executando o serviço

### Localmente

```bash
python app.py
```

O serviço estará disponível em `http://localhost:8000`.

### Com Docker

```bash
docker build -t fast-whisper-service .
docker run -p 8000:8000 -e SUPABASE_URL=https://your-project-id.supabase.co -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key fast-whisper-service
```

## Integrando fast-whisper

Para integrar a biblioteca fast-whisper:

1. Descomente as dependências no arquivo `requirements.txt`
2. Instale as dependências atualizadas
3. Descomente e implemente o código de transcrição na função `process_transcription` no arquivo `app.py`

## Endpoints

- `GET /`: Verifica se o serviço está em execução
- `GET /health`: Verifica a saúde do serviço
- `POST /transcribe`: Inicia uma transcrição

### Exemplo de uso

```python
import requests

response = requests.post(
    "http://localhost:8000/transcribe",
    json={
        "transcription_id": "uuid-da-transcricao",
        "audio_url": "https://url-do-audio.webm",
        "language": "pt"
    }
)

print(response.json())
```
