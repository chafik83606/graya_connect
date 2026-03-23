import 'package:cloud_firestore/cloud_firestore.dart';

class Post {
  final String id;
  final String userId;
  final String userName;
  final String? userPhotoUrl;
  final String content;
  final String? imageUrl;
  final DateTime createdAt;
  final Map<String, int> reactions; // ex: {'❤️': 5, '😂': 2}

  Post({
    required this.id,
    required this.userId,
    required this.userName,
    this.userPhotoUrl,
    required this.content,
    this.imageUrl,
    required this.createdAt,
    Map<String, int>? reactions,
  }) : reactions = reactions ?? {};

  // Convertir depuis Firestore
  factory Post.fromFirestore(Map<String, dynamic> data, String documentId) {
    return Post(
      id: documentId,
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? '',
      userPhotoUrl: data['userPhotoUrl'],
      content: data['content'] ?? '',
      imageUrl: data['imageUrl'],
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      reactions: Map<String, int>.from(data['reactions'] ?? {}),
    );
  }

  // Convertir vers Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'userName': userName,
      'userPhotoUrl': userPhotoUrl,
      'content': content,
      'imageUrl': imageUrl,
      'createdAt': Timestamp.fromDate(createdAt),
      'reactions': reactions,
    };
  }
}
