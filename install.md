# Download and install n and Node.js:
```sh
# Download and install n and Node.js:
curl -fsSL https://raw.githubusercontent.com/mklement0/n-install/stable/bin/n-install | bash -s 24
# Node.js already installs during n-install, but you can also install it manually:
#   n install 24

# Verify the Node.js version:
node -v # Should print "v24.18.0".

# Verify npm version:
npm -v # Should print "11.16.0".

npm i -g @nestjs/cli
```