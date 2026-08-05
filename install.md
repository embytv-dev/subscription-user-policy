### Download and install n and Node.js:
```sh
# Download and install n and Node.js:
curl -fsSL https://raw.githubusercontent.com/mklement0/n-install/stable/bin/n-install | bash -s 24
# Node.js already installs during n-install, but you can also install it manually:
#   n install 24

# Verify the Node.js version:
node -v # Should print "v24.18.0".

# Verify npm version:
npm -v # Should print "11.16.0".

npm install pm2 -g
pm2 -v
# 7.0.3

npm i -g @nestjs/cli
```

### Logs

Установить ротирование логов. Нужно установить под тем(и) пользователем(и) под которыми будут запускаться сервисы
```sh
# need for log rotation. next command have to be run for main user (not for root)
pm2 install pm2-logrotate
```


### Subscription-user-policy

Склонировать и задплоить проет
```sh
git clone https://github.com/embytv-dev/subscription-user-policy.git

sh deploy.sh
```

Зайти во внутрь папки `subscription-user-policy`  
Скопировать `.env.exaple` в `.env`  настроить там доступы и параметры  

Задеплоить приложение
```sh
sh deploy.sh
```

Сохранить запуск для автозагрузки
```sh
pm2 startup
# if user is not root need to run next command:
# sudo env PATH=$PATH:/usr/local/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u remit_admin --hp /home/remit_admin  
pm2 save  
```

### Delete all pm2 services
Чтобы остановить приложение - выполнить 
```sh
pm2 run undeploy
```

Чтобы выключить модуль `pm2-logrotate` нужно его деинсталлировать для текущего линукс пользователя выполнив команды:
```sh
pm2 stop 0
pm2 uninstall pm2-logrotate
```
где 0 - ИД pm2-logrotate сервиса

Что бы очистить все процессы и не допустить их появления в автозагрузке нужно выполнить команды:
```sh
pm2 delete all  
pm2 cleardump  
pm2 update  
```
