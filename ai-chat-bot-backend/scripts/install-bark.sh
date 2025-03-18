#!/bin/bash

echo "Installing Bark model in Ollama..."

# Create a temporary Modelfile
cat > Modelfile << EOL
FROM llama2

# Use GPU acceleration
PARAMETER temperature 0.7
PARAMETER top_p 0.95
PARAMETER num_ctx 2048

# Install Bark dependencies
SYSTEM """
You are Bark, a text-to-speech model. You can generate high-quality audio in multiple languages.
When given text input, you will return a base64-encoded WAV file containing the synthesized speech.

Format your response as:
data:audio/wav;base64,<base64-encoded-audio-data>

Available voice presets:
- v2/en_speaker_1 (English male)
- v2/en_speaker_2 (English female)
- v2/ja_speaker_6 (Japanese female)
- v2/es_speaker_3 (Spanish male)
- v2/zh_speaker_5 (Chinese female)
"""
EOL

# Create the model
echo "Creating Bark model..."
ollama create bark -f Modelfile

# Clean up
rm Modelfile

echo "Bark model installation complete!" 