test:
	./node_modules/.bin/qunit -d connect:./node_modules/connect -c store:./index.js -t ./test.js
