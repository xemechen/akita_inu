list:
	docker ps -a
	docker network ls
	docker container ls
	docker volume ls

net:
	docker network create --driver=bridge akita-network

build:
	docker build -t akitainu/node-web-app .

run:
	docker run --name akitainu-web -p 49160:3000 -d --network akita-network akitainu/node-web-app

buildRun:
	make build
	make run

stop:
	docker stop akitainu-web

kill:
	make stop
	docker rm akitainu-web

exec:
	docker exec -it akitainu-web /bin/bash
	# (輸入exit離開Container 或 熱鍵ctrl+d)

runMysql:
	docker run --name akitainu-mysql -p 3306:3306 -v akitainu-mysql:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=akitainu_thebest -e MYSQL_DATABASE=akitainu --network akita-network -d mysql:8.0.20
	# where akitainu-mysql is the name you want to assign to your container, akitainu_thebest is the password to be set for the MySQL root user 
	# and tag is the tag specifying the MySQL version you want. See the list above for relevant tags.

killMysql:
	docker stop akitainu-mysql
	docker rm akitainu-mysql

killAll:
	make kill
	make killMysql

runMysqlClient:
	docker run -it --network akita-network --rm mysql mysql -hakitainu-mysql -uexample-user -p

restart:
	make kill
	make buildRun
	docker ps -a
