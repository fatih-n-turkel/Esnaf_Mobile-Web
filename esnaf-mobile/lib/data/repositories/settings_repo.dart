import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

class SettingsRepo {
  static const _key = 'app_settings';

  AppSettings getSettings() {
    final box = HiveBoxes.box(HiveBoxes.settings);
    final raw = box.get(_key);
    if (raw == null) {
      final defaults = AppSettings.defaults();
      box.put(_key, defaults.toMap());
      return defaults;
    }
    return AppSettings.fromMap(raw);
  }

  Future<void> save(AppSettings settings) async {
    final box = HiveBoxes.box(HiveBoxes.settings);
    await box.put(_key, settings.toMap());
  }
}

final settingsRepoProvider = Provider<SettingsRepo>((ref) => SettingsRepo());
final settingsProvider = StateNotifierProvider<SettingsNotifier, AppSettings>((ref) {
  final repo = ref.watch(settingsRepoProvider);
  return SettingsNotifier(repo);
});

class SettingsNotifier extends StateNotifier<AppSettings> {
  SettingsNotifier(this._repo) : super(_repo.getSettings());

  final SettingsRepo _repo;

  Future<void> update(AppSettings s) async {
    state = s;
    await _repo.save(s);
  }
}
