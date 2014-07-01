test:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --timeout 3000

# Test coverage with Istanbul
ist:
	@NODE_ENV=test ./node_modules/.bin/istanbul cover -- ./node_modules/.bin/_mocha --recursive

.PHONY: test ist
