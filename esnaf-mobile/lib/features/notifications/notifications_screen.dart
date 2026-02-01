import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/notifications_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/models/models.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final List<_ToggleOption> _active = [
    _ToggleOption('Kritik stok uyarıları', true),
    _ToggleOption('Gün sonu satış ve kâr özeti', true),
    _ToggleOption('Uzun süredir satılmayan ürün uyarıları', true),
  ];

  final List<_ToggleOption> _personal = [
    _ToggleOption('Sadece kritik uyarıları göster', false),
    _ToggleOption('Haftalık özet e-postası gönder', false),
    _ToggleOption('Kasiyer / personel bildirimlerini filtrele', false),
  ];

  @override
  Widget build(BuildContext context) {
    ref.watch(branchesSeedProvider);
    final auth = ref.watch(authRepoProvider);
    final businessId = auth.getBusinessId();
    final notifications = ref.watch(notificationsRepoProvider);
    final branches = ref.watch(branchesRepoProvider).list(businessId: businessId);
    final scopeNotes = notifications.list(
      branchId: auth.getBranchId(),
      userId: auth.currentUserId,
      role: auth.getRole(),
      businessId: businessId,
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifications.markAllRead(
        branchId: auth.getBranchId(),
        userId: auth.currentUserId,
        role: auth.getRole(),
        businessId: businessId,
      );
    });

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Bildirimler', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Kritik stok, satış özeti ve ürün performans uyarıları.', style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Bildirim Akışı',
            children: [
              if (scopeNotes.isEmpty)
                const Text('Bildirim bulunamadı.', style: TextStyle(color: Colors.black54)),
              ...scopeNotes.map((note) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(note.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(
                      '${note.message}\n${_scopeLabel(note, branches)} • ${_fmtDate(note.createdAt)}',
                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  )),
            ],
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Aktif Bildirimler',
            children: _active
                .map((option) => CheckboxListTile(
                      value: option.enabled,
                      onChanged: (v) => setState(() => option.enabled = v ?? option.enabled),
                      title: Text(option.label),
                      controlAffinity: ListTileControlAffinity.leading,
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Kullanıcıya Özel Ayarlar',
            subtitle:
                'Bildirim sıklığı, kanal (uygulama içi/e-posta) ve rol bazlı filtreler kullanıcı tarafından özelleştirilebilir.',
            children: _personal
                .map((option) => CheckboxListTile(
                      value: option.enabled,
                      onChanged: (v) => setState(() => option.enabled = v ?? option.enabled),
                      title: Text(option.label),
                      controlAffinity: ListTileControlAffinity.leading,
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _ToggleOption {
  _ToggleOption(this.label, this.enabled);
  final String label;
  bool enabled;
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children, this.subtitle});
  final String title;
  final String? subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ],
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }
}

String _fmtDate(int createdAt) {
  final dt = DateTime.fromMillisecondsSinceEpoch(createdAt);
  return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
}

String _scopeLabel(AppNotification note, List<Branch> branches) {
  if (note.scope == NotificationScope.branch) {
    final branch = branches.where((b) => b.id == note.branchId).toList();
    return branch.isEmpty ? 'Bilinmeyen bayi' : branch.first.name;
  }
  if (note.scope == NotificationScope.user) return 'Size özel';
  return 'Genel';
}
