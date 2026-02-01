import 'package:uuid/uuid.dart';

const _uuid = Uuid();

String newId() => _uuid.v4();

enum PaymentType { cash, card }

enum PosFeeType { percent, fixed }

enum StockMoveType { inMove, outMove, adjust }

enum NotificationScope { global, branch, user }

class Branch {
  Branch({required this.id, required this.name, required this.createdAt, required this.businessId});

  final String id;
  final String name;
  final int createdAt;
  final String businessId;

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'createdAt': createdAt,
        'businessId': businessId,
      };

  factory Branch.fromMap(Map m) => Branch(
        id: (m['id'] ?? '') as String,
        name: (m['name'] ?? '') as String,
        createdAt: (m['createdAt'] ?? 0) as int,
        businessId: (m['businessId'] ?? '') as String,
      );
}

class Product {
  Product({
    required this.id,
    required this.businessId,
    required this.name,
    required this.category,
    required this.salePrice,
    required this.costPrice,
    required this.vatRate,
    required this.criticalStock,
    required this.stockQty,
    required this.stockByBranch,
    required this.isActive,
    required this.qrValue,
    required this.updatedAt,
  });

  final String id;
  final String businessId;
  final String name;
  final String category;
  final double salePrice;
  final double costPrice;
  final double vatRate; // 0.20 = %20
  final double criticalStock;
  final double stockQty;
  final Map<String, double> stockByBranch;
  final bool isActive;
  final String qrValue;
  final int updatedAt;

  Map<String, dynamic> toMap() => {
        'id': id,
        'businessId': businessId,
        'name': name,
        'category': category,
        'salePrice': salePrice,
        'costPrice': costPrice,
        'vatRate': vatRate,
        'criticalStock': criticalStock,
        'stockQty': stockQty,
        'stockByBranch': stockByBranch,
        'isActive': isActive,
        'qrValue': qrValue,
        'updatedAt': updatedAt,
      };

  static Product fromMap(Map m) => Product(
        id: m['id'] as String,
        businessId: (m['businessId'] ?? '') as String,
        name: m['name'] as String,
        category: (m['category'] ?? '') as String,
        salePrice: (m['salePrice'] ?? 0).toDouble(),
        costPrice: (m['costPrice'] ?? 0).toDouble(),
        vatRate: (m['vatRate'] ?? 0.20).toDouble(),
        criticalStock: (m['criticalStock'] ?? 0).toDouble(),
        stockQty: (m['stockQty'] ?? 0).toDouble(),
        stockByBranch: (m['stockByBranch'] is Map
            ? (m['stockByBranch'] as Map).map((key, value) => MapEntry(key.toString(), (value ?? 0).toDouble()))
            : <String, double>{}),
        isActive: (m['isActive'] ?? true) as bool,
        qrValue: (m['qrValue'] ?? '') as String,
        updatedAt: (m['updatedAt'] ?? DateTime.now().millisecondsSinceEpoch) as int,
      );

  Product copyWith({
    String? name,
    String? category,
    double? salePrice,
    double? costPrice,
    double? vatRate,
    double? criticalStock,
    double? stockQty,
    Map<String, double>? stockByBranch,
    bool? isActive,
    String? qrValue,
    int? updatedAt,
  }) =>
      Product(
        id: id,
        businessId: businessId,
        name: name ?? this.name,
        category: category ?? this.category,
        salePrice: salePrice ?? this.salePrice,
        costPrice: costPrice ?? this.costPrice,
        vatRate: vatRate ?? this.vatRate,
        criticalStock: criticalStock ?? this.criticalStock,
        stockQty: stockQty ?? this.stockQty,
        stockByBranch: stockByBranch ?? this.stockByBranch,
        isActive: isActive ?? this.isActive,
        qrValue: qrValue ?? this.qrValue,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}

class Sale {
  Sale({
    required this.id,
    required this.businessId,
    required this.receiptNo,
    required this.paymentType,
    required this.posFeeType,
    required this.posFeeValue,
    required this.totalGross,
    required this.totalVat,
    required this.totalNetProfit,
    required this.createdAt,
    required this.createdBy,
    required this.branchId,
    required this.status,
  });

  final String id;
  final String businessId;
  final String receiptNo;
  final PaymentType paymentType;
  final PosFeeType posFeeType;
  final double posFeeValue;
  final double totalGross;
  final double totalVat;
  final double totalNetProfit;
  final int createdAt;
  final String createdBy;
  final String branchId;
  final String status; // completed/cancelled

  Map<String, dynamic> toMap() => {
        'id': id,
        'businessId': businessId,
        'receiptNo': receiptNo,
        'paymentType': paymentType.name,
        'posFeeType': posFeeType.name,
        'posFeeValue': posFeeValue,
        'totalGross': totalGross,
        'totalVat': totalVat,
        'totalNetProfit': totalNetProfit,
        'createdAt': createdAt,
        'createdBy': createdBy,
        'branchId': branchId,
        'status': status,
      };

  static Sale fromMap(Map m) => Sale(
        id: m['id'] as String,
        businessId: (m['businessId'] ?? '') as String,
        receiptNo: (m['receiptNo'] ?? '') as String,
        paymentType: PaymentType.values.firstWhere((e) => e.name == (m['paymentType'] ?? 'cash')),
        posFeeType: PosFeeType.values.firstWhere((e) => e.name == (m['posFeeType'] ?? 'percent')),
        posFeeValue: (m['posFeeValue'] ?? 0).toDouble(),
        totalGross: (m['totalGross'] ?? 0).toDouble(),
        totalVat: (m['totalVat'] ?? 0).toDouble(),
        totalNetProfit: (m['totalNetProfit'] ?? 0).toDouble(),
        createdAt: (m['createdAt'] ?? 0) as int,
        createdBy: (m['createdBy'] ?? 'admin') as String,
        branchId: (m['branchId'] ?? '') as String,
        status: (m['status'] ?? 'completed') as String,
      );
}

class SaleItem {
  SaleItem({
    required this.id,
    required this.saleId,
    required this.productId,
    required this.productName,
    required this.qty,
    required this.unitSalePrice,
    required this.unitCost,
    required this.vatRate,
  });

  final String id;
  final String saleId;
  final String productId;
  final String productName;
  final double qty;
  final double unitSalePrice;
  final double unitCost;
  final double vatRate;

  double get lineGross => qty * unitSalePrice;

  double get lineVat => lineGross - (lineGross / (1 + vatRate));

  double get lineProfit => (unitSalePrice - unitCost) * qty;

  Map<String, dynamic> toMap() => {
        'id': id,
        'saleId': saleId,
        'productId': productId,
        'productName': productName,
        'qty': qty,
        'unitSalePrice': unitSalePrice,
        'unitCost': unitCost,
        'vatRate': vatRate,
      };

  static SaleItem fromMap(Map m) => SaleItem(
        id: m['id'] as String,
        saleId: m['saleId'] as String,
        productId: m['productId'] as String,
        productName: (m['productName'] ?? '') as String,
        qty: (m['qty'] ?? 0).toDouble(),
        unitSalePrice: (m['unitSalePrice'] ?? 0).toDouble(),
        unitCost: (m['unitCost'] ?? 0).toDouble(),
        vatRate: (m['vatRate'] ?? 0.20).toDouble(),
      );
}

class StockMovement {
  StockMovement({
    required this.id,
    required this.productId,
    required this.type,
    required this.qty,
    required this.reason,
    required this.createdAt,
    required this.createdBy,
    required this.branchId,
    required this.businessId,
  });

  final String id;
  final String productId;
  final StockMoveType type;
  final double qty;
  final String reason;
  final int createdAt;
  final String createdBy;
  final String branchId;
  final String businessId;

  Map<String, dynamic> toMap() => {
        'id': id,
        'productId': productId,
        'type': type.name,
        'qty': qty,
        'reason': reason,
        'createdAt': createdAt,
        'createdBy': createdBy,
        'branchId': branchId,
        'businessId': businessId,
      };

  static StockMovement fromMap(Map m) => StockMovement(
        id: m['id'] as String,
        productId: m['productId'] as String,
        type: StockMoveType.values.firstWhere((e) => e.name == (m['type'] ?? 'outMove')),
        qty: (m['qty'] ?? 0).toDouble(),
        reason: (m['reason'] ?? '') as String,
        createdAt: (m['createdAt'] ?? 0) as int,
        createdBy: (m['createdBy'] ?? 'admin') as String,
        branchId: (m['branchId'] ?? '') as String,
        businessId: (m['businessId'] ?? '') as String,
      );
}

class OutboxEvent {
  OutboxEvent({
    required this.id,
    required this.type,
    required this.payload,
    required this.createdAt,
    required this.retryCount,
    required this.lastError,
  });

  final String id;
  final String type;
  final Map<String, dynamic> payload;
  final int createdAt;
  final int retryCount;
  final String? lastError;

  Map<String, dynamic> toMap() => {
        'id': id,
        'type': type,
        'payload': payload,
        'createdAt': createdAt,
        'retryCount': retryCount,
        'lastError': lastError,
      };

  static OutboxEvent fromMap(Map m) => OutboxEvent(
        id: m['id'] as String,
        type: (m['type'] ?? '') as String,
        payload: Map<String, dynamic>.from(m['payload'] as Map),
        createdAt: (m['createdAt'] ?? 0) as int,
        retryCount: (m['retryCount'] ?? 0) as int,
        lastError: m['lastError'] as String?,
      );
}

class AppSettings {
  AppSettings({
    required this.defaultVatRate,
    required this.posFeeType,
    required this.posFeeValue,
    required this.profitHiddenForStaff,
    required this.criticalStockDefault,
  });

  final double defaultVatRate;
  final PosFeeType posFeeType;
  final double posFeeValue;
  final bool profitHiddenForStaff;
  final double criticalStockDefault;

  Map<String, dynamic> toMap() => {
        'defaultVatRate': defaultVatRate,
        'posFeeType': posFeeType.name,
        'posFeeValue': posFeeValue,
        'profitHiddenForStaff': profitHiddenForStaff,
        'criticalStockDefault': criticalStockDefault,
      };

  static AppSettings fromMap(Map m) => AppSettings(
        defaultVatRate: (m['defaultVatRate'] ?? 0.20).toDouble(),
        posFeeType: PosFeeType.values.firstWhere((e) => e.name == (m['posFeeType'] ?? 'percent')),
        posFeeValue: (m['posFeeValue'] ?? 0).toDouble(),
        profitHiddenForStaff: (m['profitHiddenForStaff'] ?? true) as bool,
        criticalStockDefault: (m['criticalStockDefault'] ?? 5).toDouble(),
      );

  static AppSettings defaults() => AppSettings(
        defaultVatRate: 0.20,
        posFeeType: PosFeeType.percent,
        posFeeValue: 2.5,
        profitHiddenForStaff: true,
        criticalStockDefault: 5,
      );
}

class AppNotification {
  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.scope,
    required this.businessId,
    this.readAt,
    this.branchId,
    this.userId,
  });

  final String id;
  final String title;
  final String message;
  final int createdAt;
  final int? readAt;
  final NotificationScope scope;
  final String businessId;
  final String? branchId;
  final String? userId;

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'message': message,
        'createdAt': createdAt,
        'readAt': readAt,
        'scope': scope.name,
        'businessId': businessId,
        'branchId': branchId,
        'userId': userId,
      };

  static AppNotification fromMap(Map m) => AppNotification(
        id: (m['id'] ?? '') as String,
        title: (m['title'] ?? '') as String,
        message: (m['message'] ?? '') as String,
        createdAt: (m['createdAt'] ?? 0) as int,
        readAt: m['readAt'] as int?,
        scope: NotificationScope.values.firstWhere(
          (e) => e.name == (m['scope'] ?? 'global'),
          orElse: () => NotificationScope.global,
        ),
        businessId: (m['businessId'] ?? '') as String,
        branchId: m['branchId'] as String?,
        userId: m['userId'] as String?,
      );
}

class BusinessPlan {
  BusinessPlan({
    required this.id,
    required this.name,
    required this.monthlyPrice,
    required this.annualPrice,
    required this.maxEmployees,
    required this.maxBranches,
    required this.features,
  });

  final String id;
  final String name;
  final double monthlyPrice;
  final double annualPrice;
  final int maxEmployees;
  final int maxBranches;
  final List<String> features;

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'monthlyPrice': monthlyPrice,
        'annualPrice': annualPrice,
        'maxEmployees': maxEmployees,
        'maxBranches': maxBranches,
        'features': features,
      };

  factory BusinessPlan.fromMap(Map m) => BusinessPlan(
        id: (m['id'] ?? '') as String,
        name: (m['name'] ?? '') as String,
        monthlyPrice: (m['monthlyPrice'] ?? 0).toDouble(),
        annualPrice: (m['annualPrice'] ?? 0).toDouble(),
        maxEmployees: (m['maxEmployees'] ?? 0) as int,
        maxBranches: (m['maxBranches'] ?? 0) as int,
        features: (m['features'] as List?)?.map((e) => e.toString()).toList() ?? [],
      );

  BusinessPlan copyWith({
    double? monthlyPrice,
    double? annualPrice,
    int? maxEmployees,
    int? maxBranches,
    List<String>? features,
  }) {
    return BusinessPlan(
      id: id,
      name: name,
      monthlyPrice: monthlyPrice ?? this.monthlyPrice,
      annualPrice: annualPrice ?? this.annualPrice,
      maxEmployees: maxEmployees ?? this.maxEmployees,
      maxBranches: maxBranches ?? this.maxBranches,
      features: features ?? this.features,
    );
  }
}

class Business {
  Business({
    required this.id,
    required this.name,
    required this.planId,
    required this.billingCycle,
    required this.createdAt,
    this.paymentMethods,
  });

  final String id;
  final String name;
  final String planId;
  final String billingCycle;
  final int createdAt;
  final List<PaymentMethod>? paymentMethods;

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'planId': planId,
        'billingCycle': billingCycle,
        'createdAt': createdAt,
        'paymentMethods': paymentMethods?.map((method) => method.toMap()).toList() ?? [],
      };

  factory Business.fromMap(Map m) => Business(
        id: (m['id'] ?? '') as String,
        name: (m['name'] ?? '') as String,
        planId: (m['planId'] ?? '') as String,
        billingCycle: (m['billingCycle'] ?? 'FREE') as String,
        createdAt: (m['createdAt'] ?? 0) as int,
        paymentMethods: (m['paymentMethods'] as List?)
                ?.map((entry) => PaymentMethod.fromMap(entry as Map))
                .toList() ??
            [],
      );
}

class PaymentMethod {
  PaymentMethod({
    required this.id,
    required this.label,
    required this.holderName,
    required this.cardNumber,
    required this.expMonth,
    required this.expYear,
    required this.cvc,
  });

  final String id;
  final String label;
  final String holderName;
  final String cardNumber;
  final String expMonth;
  final String expYear;
  final String cvc;

  Map<String, dynamic> toMap() => {
        'id': id,
        'label': label,
        'holderName': holderName,
        'cardNumber': cardNumber,
        'expMonth': expMonth,
        'expYear': expYear,
        'cvc': cvc,
      };

  factory PaymentMethod.fromMap(Map m) => PaymentMethod(
        id: (m['id'] ?? '') as String,
        label: (m['label'] ?? '') as String,
        holderName: (m['holderName'] ?? '') as String,
        cardNumber: (m['cardNumber'] ?? '') as String,
        expMonth: (m['expMonth'] ?? '') as String,
        expYear: (m['expYear'] ?? '') as String,
        cvc: (m['cvc'] ?? '') as String,
      );
}

class BusinessApplication {
  BusinessApplication({
    required this.id,
    required this.businessName,
    required this.username,
    required this.password,
    required this.createdAt,
    required this.status,
  });

  final String id;
  final String businessName;
  final String username;
  final String password;
  final int createdAt;
  final String status;

  Map<String, dynamic> toMap() => {
        'id': id,
        'businessName': businessName,
        'username': username,
        'password': password,
        'createdAt': createdAt,
        'status': status,
      };

  factory BusinessApplication.fromMap(Map m) => BusinessApplication(
        id: (m['id'] ?? '') as String,
        businessName: (m['businessName'] ?? '') as String,
        username: (m['username'] ?? '') as String,
        password: (m['password'] ?? '') as String,
        createdAt: (m['createdAt'] ?? 0) as int,
        status: (m['status'] ?? 'PENDING') as String,
      );
}
