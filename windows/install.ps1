# Powershell script to copy the vs code settings and keybindings
Copy-Item -Path ..\keybindings.json -Destination C:\Users\$env:username\AppData\Roaming\Code\User\keybindings.json
Copy-Item -Path ..\settings.json -Destination C:\Users\$env:username\AppData\Roaming\Code\User\settings.json

# Install VS Code Extensions
# Cpp
code --install-extension ms-vscode.cpptools
# Python
code --install-extension ms-python.python
# CMake
code --install-extension twxs.cmake
# GIT
code --install-extension eamodio.gitlens
# SSH
code --install-extension ms-vscode-remote.remote-ssh
code --install-extension ms-vscode-remote.remote-ssh-edit
#Poweshell
code --install-extension ms-vscode.powershell
#Azure
code --install-extension ms-vscode.azure-account
code --install-extension ms-azuretools.vscode-azureappservice
code --install-extension ms-vscode.azurecli
# Containers
code --install-extension ms-vscode-remote.remote-containers
# WSL
code --install-extension ms-vscode-remote.remote-wsl
# PlantUML
code --install-extension jebbs.plantuml
# Markdown Lint
code --install-extension DavidAnson.vscode-markdownlint
code --install-extension shd101wyy.markdown-preview-enhanced
# Horizon Theme
code --install-extension jolaleye.horizon-theme-vscode
