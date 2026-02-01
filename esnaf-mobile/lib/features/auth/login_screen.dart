import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/applications_repo.dart';
import '../../data/models/models.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _business = TextEditingController(text: 'Şen Bakkal');
  final _user = TextEditingController(text: 'fatih');
  final _pass = TextEditingController(text: 'fatih');
  final _applyBusiness = TextEditingController();
  final _applyUser = TextEditingController();
  final _applyPass = TextEditingController();
  bool _loading = false;
  bool _showApply = false;
  String? _applyMessage;

  @override
  void dispose() {
    _business.dispose();
    _user.dispose();
    _pass.dispose();
    _applyBusiness.dispose();
    _applyUser.dispose();
    _applyPass.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() => _loading = true);
    try {
      await ref.read(authRepoProvider).login(
            businessName: _business.text.trim(),
            username: _user.text.trim(),
            password: _pass.text.trim(),
          );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitApplication() async {
    final businessName = _applyBusiness.text.trim();
    final username = _applyUser.text.trim();
    final password = _applyPass.text.trim();
    if (businessName.isEmpty || username.isEmpty || password.isEmpty) {
      setState(() => _applyMessage = 'Lütfen tüm alanları doldurun.');
      return;
    }
    await ref.read(applicationsRepoProvider).add(
          BusinessApplication(
            id: newId(),
            businessName: businessName,
            username: username,
            password: password,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            status: 'PENDING',
          ),
        );
    setState(() {
      _applyMessage = 'İstek gönderildi, en kısa sürede işleme alınacaktır.';
      _applyBusiness.clear();
      _applyUser.clear();
      _applyPass.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Giriş')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Demo Kullanıcılar: fatih / mehmet / cenk', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                TextField(controller: _business, decoration: const InputDecoration(labelText: 'İşletme adı')),
                const SizedBox(height: 12),
                TextField(controller: _user, decoration: const InputDecoration(labelText: 'Kullanıcı adı')),
                const SizedBox(height: 12),
                TextField(
                  controller: _pass,
                  decoration: const InputDecoration(labelText: 'Şifre'),
                  obscureText: true,
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _loading ? null : _login,
                  icon: _loading ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.login),
                  label: const Text('Giriş Yap'),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Başvur', style: TextStyle(fontWeight: FontWeight.w700)),
                            TextButton(
                              onPressed: () => setState(() {
                                _showApply = !_showApply;
                                _applyMessage = null;
                              }),
                              child: Text(_showApply ? 'Kapat' : 'Formu Aç'),
                            ),
                          ],
                        ),
                        if (_showApply) ...[
                          TextField(
                            controller: _applyBusiness,
                            decoration: const InputDecoration(labelText: 'İşletme adı'),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _applyUser,
                            decoration: const InputDecoration(labelText: 'Kullanıcı adı'),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _applyPass,
                            decoration: const InputDecoration(labelText: 'Şifre'),
                            obscureText: true,
                          ),
                          const SizedBox(height: 8),
                          FilledButton(
                            onPressed: _submitApplication,
                            child: const Text('Başvuruyu Gönder'),
                          ),
                          if (_applyMessage != null) ...[
                            const SizedBox(height: 6),
                            Text(_applyMessage!, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                          ],
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Not: Bu MVP local/offline çalışır. Backend senkron daha sonra eklenir.', textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
