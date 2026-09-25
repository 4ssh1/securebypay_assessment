import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:web/web.dart' as web;

TextEditingController useSessionStorage(String sessionKey, {String initialValue = ''}) {
  final storedValue = web.window.sessionStorage.getItem(sessionKey) ?? initialValue;
  final controller = useTextEditingController(text: storedValue);

  useEffect(() {
    void listener() {
      web.window.sessionStorage.setItem(sessionKey, controller.text);
    }
    
    controller.addListener(listener);
    return () => controller.removeListener(listener);
  }, [controller, sessionKey]);

  return controller;
}