import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/models/post.dart';

class PostRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  CollectionReference get _posts => _firestore.collection('posts');

  Future<void> createPost(String content, {String? imageUrl}) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Utilisateur non connecté');

    final post = Post(
      id: '',
      userId: user.uid,
      userName: user.displayName ?? 'Anonyme',
      userPhotoUrl: user.photoURL,
      content: content,
      imageUrl: imageUrl,
      createdAt: DateTime.now(),
    );

    await _posts.add(post.toFirestore());
  }

  Stream<List<Post>> getPosts() {
    return _posts
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map(
                (doc) => Post.fromFirestore(
                  doc.data() as Map<String, dynamic>,
                  doc.id,
                ),
              )
              .toList(),
        );
  }

  Future<void> toggleReaction(String postId, String emoji) async {
    final userId = _auth.currentUser!.uid;
    final postRef = _posts.doc(postId);
    final reactionRef = postRef.collection('reactions').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final reactionDoc = await transaction.get(reactionRef);
      String? oldEmoji;
      if (reactionDoc.exists) {
        final data = reactionDoc.data();
        oldEmoji = data?['emoji'] as String?;
      }

      if (oldEmoji == emoji) {
        // Retirer la réaction
        transaction.delete(reactionRef);
        transaction.update(postRef, {
          'reactions.$emoji': FieldValue.increment(-1),
        });
      } else {
        // Nouvelle réaction (ou changement)
        if (oldEmoji != null) {
          transaction.update(postRef, {
            'reactions.$oldEmoji': FieldValue.increment(-1),
          });
        }
        transaction.set(reactionRef, {'emoji': emoji, 'userId': userId});
        transaction.update(postRef, {
          'reactions.$emoji': FieldValue.increment(1),
        });
      }
    });
  }

  Future<String?> getUserReaction(String postId) async {
    final userId = _auth.currentUser!.uid;
    final doc = await _posts
        .doc(postId)
        .collection('reactions')
        .doc(userId)
        .get();
    if (doc.exists) {
      final data = doc.data();
      return data?['emoji'] as String?;
    }
    return null;
  }
}
