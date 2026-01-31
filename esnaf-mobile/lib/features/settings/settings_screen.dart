import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/settings_repo.dart';
import '../../data/repositories/auth_repo.dart';
import '../../data/models/models.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  bool _canEdit(String role) => role == 'admin' || role == 'manager';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authRepoProvider).getRole();
    final canEdit = _canEdit(role);
    final s = ref.watch(settingsProvider);

    final vatC = TextEditingController(text: (s.defaultVatRate * 100).toStringAsFixed(0));
    final posValC = TextEditingController(text: s.posFeeValue.toStringAsFixed(2));
    final critC = TextEditingController(text: s.criticalStockDefault.toStringAsFixed(0));
    final currentPassC = TextEditingController();
    final newPassC = TextEditingController();
    final confirmPassC = TextEditingController();

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Ayarlar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<PosFeeType>(
                          value: s.posFeeType,
                          items: const [
                            DropdownMenuItem(value: PosFeeType.percent, child: Text('POS Komisyon %')),
                            DropdownMenuItem(value: PosFeeType.fixed, child: Text('POS Sabit ₺')),
                          ],
                          onChanged: canEdit
                              ? (v) {
                                  final next = AppSettings(
                                    defaultVatRate: s.defaultVatRate,
                                    posFeeType: v ?? s.posFeeType,
                                    posFeeValue: s.posFeeValue,
                                    profitHiddenForStaff: s.profitHiddenForStaff,
                                    criticalStockDefault: s.criticalStockDefault,
                                  );
                                  ref.read(settingsProvider.notifier).update(next);
                                }
                              : null,
                          decoration: const InputDecoration(labelText: 'POS tipi'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 120,
                        child: TextField(
                          controller: posValC,
                          enabled: canEdit,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(labelText: s.posFeeType == PosFeeType.percent ? '%' : '₺'),
                          onSubmitted: (v) {
                            final parsed = double.tryParse(v.replaceAll(',', '.'));
                            if (parsed == null) return;
                            final next = AppSettings(
                              defaultVatRate: s.defaultVatRate,
                              posFeeType: s.posFeeType,
                              posFeeValue: parsed,
                              profitHiddenForStaff: s.profitHiddenForStaff,
                              criticalStockDefault: s.criticalStockDefault,
                            );
                            ref.read(settingsProvider.notifier).update(next);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: vatC,
                          enabled: canEdit,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(labelText: 'Varsayılan KDV %'),
                          onSubmitted: (v) {
                            final parsed = double.tryParse(v.replaceAll(',', '.'));
                            if (parsed == null) return;
                            final next = AppSettings(
                              defaultVatRate: parsed / 100.0,
                              posFeeType: s.posFeeType,
                              posFeeValue: s.posFeeValue,
                              profitHiddenForStaff: s.profitHiddenForStaff,
                              criticalStockDefault: s.criticalStockDefault,
                            );
                            ref.read(settingsProvider.notifier).update(next);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: critC,
                          enabled: canEdit,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(labelText: 'Varsayılan kritik stok'),
                          onSubmitted: (v) {
                            final parsed = double.tryParse(v.replaceAll(',', '.'));
                            if (parsed == null) return;
                            final next = AppSettings(
                              defaultVatRate: s.defaultVatRate,
                              posFeeType: s.posFeeType,
                              posFeeValue: s.posFeeValue,
                              profitHiddenForStaff: s.profitHiddenForStaff,
                              criticalStockDefault: parsed,
                            );
                            ref.read(settingsProvider.notifier).update(next);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SwitchListTile(
                    value: s.profitHiddenForStaff,
                    onChanged: canEdit
                        ? (v) {
                            final next = AppSettings(
                              defaultVatRate: s.defaultVatRate,
                              posFeeType: s.posFeeType,
                              posFeeValue: s.posFeeValue,
                              profitHiddenForStaff: v,
                              criticalStockDefault: s.criticalStockDefault,
                            );
                            ref.read(settingsProvider.notifier).update(next);
                          }
                        : null,
                    title: const Text('Personelde kâr gizle'),
                  ),
                  if (!canEdit) const Text('Bu rol ayarları değiştiremez.'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Şifre Değiştir', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  TextField(
                    controller: currentPassC,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Mevcut şifre'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: newPassC,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Yeni şifre (4-32 karakter)'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: confirmPassC,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Yeni şifre tekrar'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () async {
                      final currentPassword = currentPassC.text.trim();
                      final newPassword = newPassC.text.trim();
                      final confirmPassword = confirmPassC.text.trim();
                      if (currentPassword.isEmpty) {
                        ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(content: Text('Mevcut şifreyi girin.')));
                        return;
                      }
                      if (newPassword.length < 4 || newPassword.length > 32) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Yeni şifre 4-32 karakter arasında olmalı.')),
                        );
                        return;
                      }
                      if (newPassword != confirmPassword) {
                        ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(content: Text('Yeni şifreler eşleşmiyor.')));
                        return;
                      }
                      try {
                        await ref.read(authRepoProvider).changePassword(
                              currentPassword: currentPassword,
                              newPassword: newPassword,
                            );
                        currentPassC.clear();
                        newPassC.clear();
                        confirmPassC.clear();
                        ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(content: Text('Şifre güncellendi.')));
                      } catch (e) {
                        ScaffoldMessenger.of(context)
                            .showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    },
                    child: const Text('Şifreyi Güncelle'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              title: const Text('Hakkında • Açık Kaynak Lisansları'),
              subtitle: const Text('Üçüncü taraf lisans metinlerini görüntüle'),
              trailing: const Icon(Icons.open_in_new),
              onTap: () => showLicensePage(
                context: context,
                applicationName: 'Esnaf Mobil',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
