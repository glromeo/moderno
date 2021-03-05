# moderno
Your companion for a quick and fun web development 

## Features
* HTTP/2 server with a meaningful push implemented out of the box
* A clean and simple configuration ...less is more!
* Routing using find-my-way
* WebSocket ready
* Transforms sources and modules on-the-fly
* Smart caching 

### HTTP/2

#### Self Signed Certificates

The server is shipped with certificates and a simple Root CA (codebite.pem) which can be imported in your trusted roots 
to get rid neatly of the certificate warnings issued by the browser.  

Keys and certificates have been generated following [this guide](https://deliciousbrains.com/ssl-certificate-authority-for-local-https-development/) and using **Ubuntu 20.04** under **WSL**
```
openssl genrsa -out codebite.key 2048
openssl req -x509 -new -nodes -key codebite.key -sha256 -days 1825 -out codebite.pem
openssl genrsa -out localhost.key 2048
openssl req -new -key localhost.key -out localhost.csr
openssl x509 -req  -in localhost.csr -CA codebite.pem -CAkey codebite.key -CAcreateserial -out localhost.crt -days 1825 -sha256 -extfile localhost.ext
```
If you want to use your own server private key & certificate you can specify so in ```config.server.options``` 

### Configuration


#### Command Line
In order to keep the configuration simple only few options are available on the command line:
* ```--config <pathname>``` specifies the config file to load at startup
* ```--root <pathname>``` or ```-r <pathname>``` specifies the root directory to start in
* ```--debug``` or ```-d``` shortcut to enable debugging functionality (typically more log) for the server
* ```--help``` or ```-h``` command line help

The pathnames can either be absolute or relative to the current working directory.

#### Root Directory
Unless otherwise specified the server uses the process current working directory as ```rootDir```

> This directory is particularly important because every file access is performed relative to it.

If you specify a config file on the command line and that file has a rootDir 

### Assumptions / Best Practices

* The source files **must** be esm modules. You can import 3rd party esm and cjs modules but you are not supposed to use `require(...)` in your code.
If you need to dynamically import a module try and use `await import(...)` instead. 