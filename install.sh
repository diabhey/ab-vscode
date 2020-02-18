#!/usr/bin/env bash
 
 OS=$(lsb_release -si);
 DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
 DIST="";
  
 function install_extensions(){
# C/C++ tools
code --install-extension ms-vscode.cpptools
# CMake
code --install-extension twxs.cmake
# Python
code --install-extension ms-python.python
# SVN
code --install-extension johnstoncode.svn-scm
# GIT
code --install-extension eamodio.gitlens
# PlantUML
code --install-extension jebbs.plantuml
# Docker
code --install-extension ms-azuretools.vscode-docker
# Markdown Lint
code --install-extension DavidAnson.vscode-markdownlint
code --install-extension shd101wyy.markdown-preview-enhanced
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
echo "Closing vscode...";
for pid in $(pidof code); do kill -9 $pid; done
    echo "vscode instance(s) closed."
    echo "Installing latest version..."
    if [ "$DIST" = "deb" ]; then
        sudo dpkg -i $FILENAME;
        else
        sudo rpm -i $FILENAME;
    fi
    echo "Installation finished."
    echo "Cleaning the *.rpm"
    rm *.rpm
    echo "Install vs-code extensions"
    install_extensions
    echo "Starting new version of vscode..."
    code &
    exit;
