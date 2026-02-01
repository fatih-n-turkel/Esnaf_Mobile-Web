import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

const defaultBranchMainId = 'branch-main';
const defaultBranchCoastId = 'branch-coast';
const defaultBranchKasapId = 'branch-kasap';
const businessBakkalId = 'biz-sen-bakkal';
const businessKasapId = 'biz-sen-kasap';

class BranchesRepo {
  Future<void> ensureSeed() async {
    final box = HiveBoxes.box(HiveBoxes.branches);
    if (box.isNotEmpty) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final branches = [
      Branch(id: defaultBranchMainId, name: 'Merkez Şube', createdAt: now, businessId: businessBakkalId),
      Branch(id: defaultBranchCoastId, name: 'Sahil Şube', createdAt: now, businessId: businessBakkalId),
      Branch(id: defaultBranchKasapId, name: 'Ana Şube', createdAt: now, businessId: businessKasapId),
    ];
    for (final branch in branches) {
      await box.put(branch.id, branch.toMap());
    }
  }

  List<Branch> list({String? businessId}) {
    final box = HiveBoxes.box(HiveBoxes.branches);
    final items = box.values.map((m) => Branch.fromMap(m)).where((branch) {
      if (businessId == null || businessId.isEmpty) return true;
      return branch.businessId == businessId;
    }).toList();
    items.sort((a, b) => a.name.compareTo(b.name));
    return items;
  }

  Future<Branch?> addBranch(String name, {required String businessId}) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return null;
    final box = HiveBoxes.box(HiveBoxes.branches);
    final created = Branch(
      id: newId(),
      name: trimmed,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      businessId: businessId,
    );
    await box.put(created.id, created.toMap());
    return created;
  }
}

final branchesRepoProvider = Provider<BranchesRepo>((ref) => BranchesRepo());
final branchesSeedProvider = FutureProvider<void>((ref) async {
  final repo = ref.watch(branchesRepoProvider);
  await repo.ensureSeed();
});
