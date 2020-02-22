#!/usr/bin/env bash
 
 OS=$(lsb_release -si);
 DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
 DIST="";

 function copy_settings(){
     cp ../keybindings.json ~/.config/Code/User/keybindings.json
     cp ../settings.json ~/.config/Code/User/settings.json
 }

 function install_extensions(){
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
#Azure
code --install-extension ms-vscode.azure-account
code --install-extension ms-azuretools.vscode-azureappservice
code --install-extension ms-vscode.azurecli
# Containers
code --install-extension ms-vscode-remote.remote-containers
# PlantUML
code --install-extension jebbs.plantuml
# Markdown Lint
code --install-extension DavidAnson.vscode-markdownlint
code --install-extension shd101wyy.markdown-preview-enhanced
# Horizon Theme
code --install-extension jolaleye.horizon-theme-vscode
} 

if [ "$OS" = "Ubuntu" ] || [ "$OS" = "Debian" ]; then    
    DIST="deb";
elif [ "$OS" = "CentOS" ]; then
    DIST="rpm";
else
        echo "Unfortunately your operating system is not supported in distributed packages.";
        exit;
fi
           
URLBASE="https://vscode-update.azurewebsites.net/latest/linux-${DIST}-x64/stable";
FILENAME="$DIR/latest.${DIST}";            
if test -e "$FILENAME"; then
    rm $FILENAME;
    echo "Removed last downloaded version.";
fi

echo "Downloading latest version of vscode is starting...";
wget -O $FILENAME $URLBASE;
echo "Downloading finished\n";                  
echo "Installing latest version..."
if [ "$DIST" = "deb" ]; then
    sudo dpkg -i $FILENAME;
    echo "Cleaning the *.deb"
    rm *.deb          
else
    sudo rpm -i $FILENAME;
    echo "Cleaning the *.rpm"
    rm *.rpm        
fi
echo "Installation finished."
echo "Copy keybindings and settings"
copy_settings
echo "Install vs-code extensions"
install_extensions
echo "Starting new version of vscode..."
code .
exit;
