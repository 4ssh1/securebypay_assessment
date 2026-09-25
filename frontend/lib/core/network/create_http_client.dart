import 'package:http/http.dart' as http;

import 'create_http_client_io.dart'
    if (dart.library.js_interop) 'create_http_client_web.dart' as impl;

http.Client createPlatformHttpClient() => impl.createPlatformHttpClient();