import redis;
import json;

def application(env, start_response):
	path = env['PATH_INFO']
	if path == '/api':
		start_response('200 OK', [('Content-type', 'text/plain')])
		return [b'Hello world, Test_/app!']
	elif path == '/api/redis':
		r = redis.Redis(host='redis-master', port=6379, db=0)
		r.set('foo', 'bar')
		start_response('200 OK', [('Content-type', 'text/plain')])
		return [r.get('foo')]
	else:
		start_response('200 OK', [('Content-type', 'text/plain')])
		return [path.encode('utf-8')]
