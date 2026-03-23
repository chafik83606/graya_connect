import 'package:flutter/material.dart';
import '../../data/repositories/post_repository.dart'; // ← corrigé
import '../../core/models/post.dart';

class PostViewModel extends ChangeNotifier {
  final PostRepository _repository = PostRepository();

  List<Post> _posts = [];
  List<Post> get posts => _posts;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  PostViewModel() {
    loadPosts();
  }

  void loadPosts() {
    _repository
        .getPosts()
        .listen((newPosts) {
          _posts = newPosts;
          notifyListeners();
        })
        .onError((error) {
          _error = error.toString();
          notifyListeners();
        });
  }

  Future<void> createPost(String content, {String? imageUrl}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.createPost(content, imageUrl: imageUrl);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleReaction(String postId, String emoji) async {
    try {
      await _repository.toggleReaction(postId, emoji);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
