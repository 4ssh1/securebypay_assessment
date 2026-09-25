enum UserRole {
  user,
  staff,
  manager,
  admin,
  unknown;

  static UserRole fromJson(String? value) => switch (value) {
        'user' => UserRole.user,
        'staff' => UserRole.staff,
        'manager' => UserRole.manager,
        'admin' => UserRole.admin,
        _ => UserRole.unknown,
      };

  String get label => switch (this) {
        UserRole.user => 'Customer',
        UserRole.staff => 'Staff',
        UserRole.manager => 'Manager',
        UserRole.admin => 'Admin',
        UserRole.unknown => 'Unknown',
      };
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.role,
    required this.isEmailVerified,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String,
        role: UserRole.fromJson(json['role'] as String?),
        isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      );

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final UserRole role;
  final bool isEmailVerified;

  String get fullName => '$firstName $lastName';
}