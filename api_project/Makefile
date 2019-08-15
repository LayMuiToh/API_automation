#!make
__dummy := $(shell touch .env)
include .env
export

.DEFAULT_GOAL := docker-build

NOW = $(shell date +"%c" | tr ' :' '__')
NAME=internal/stella-api-test
TAG = $(shell majorVersion=1.0 && branch=$$(git branch | grep \* | cut -d ' ' -f2) && branch=-$${branch\#\#\*\/} && branch=$${branch/-master/} && branch=$${branch/feature-/} && echo "$${majorVersion}.$$(git rev-list HEAD --count . )$${branch}" )

help:
	@echo ""
	@echo " +---------------------------------------------+"
	@echo " | Telepathy Labs Test Image Suite             |"
	@echo " +---------------------------------------------+"
	@echo " |_ docker-push"
	@echo " |      Pushes current version up to repo"
	@echo " |_ docker-build"
	@echo " |      Builds Current version"
	@echo " |_ test-nightly"
	@echo " |      Execute nightly test"
	@echo " |_ test-sanity"
	@echo " |      Execute sanity test"		
	@echo " +---------------------------------------------+"
	@echo ""

docker-build:
	docker build  -t docker.exm-platform.com/${NAME}:${TAG} .

docker-push:
	docker push docker.exm-platform.com/${NAME}:${TAG}

test-nightly:
	docker run -v ~/.aws:/root/.aws -v `pwd`/src:/test/src docker.exm-platform.com/${NAME}:${TAG} /bin/sh test.sh nightly

test-sanity:
	docker run -v ~/.aws:/root/.aws -v `pwd`/src:/test/src docker.exm-platform.com/${NAME}:${TAG} /bin/sh test.sh sanity
