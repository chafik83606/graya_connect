import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class AuthViewModel extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? _user;
  User? get user => _user;

  AuthViewModel() {
    _auth.authStateChanges().listen((User? user) {
      print('Auth state changed: user = $user'); // ← ajoute
      _user = user;
      notifyListeners();
    });
  }

  // Connexion avec email/mot de passe
  Future<String?> signInWithEmail(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      return null; // Pas d'erreur
    } on FirebaseAuthException catch (e) {
      return _getFriendlyErrorMessage(e);
    } catch (e) {
      return 'Une erreur inattendue est survenue';
    }
  }

  // Inscription avec email/mot de passe
  Future<String?> signUpWithEmail(String email, String password) async {
    try {
      await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      return null;
    } on FirebaseAuthException catch (e) {
      // Si malgré l'exception l'utilisateur est connecté, on ignore l'erreur
      if (_auth.currentUser != null) return null;
      return _getFriendlyErrorMessage(e);
    } catch (e) {
      if (_auth.currentUser != null) return null;
      return 'Une erreur inattendue est survenue';
    }
  }

  // Déconnexion
  Future<void> signOut() async {
    await _auth.signOut();
  }

  // Traduit les codes d'erreur Firebase en messages compréhensibles
  String _getFriendlyErrorMessage(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-email':
        return 'L\'adresse email n\'est pas valide.';
      case 'user-disabled':
        return 'Ce compte utilisateur a été désactivé.';
      case 'user-not-found':
        return 'Aucun utilisateur trouvé avec cet email.';
      case 'wrong-password':
        return 'Mot de passe incorrect.';
      case 'email-already-in-use':
        return 'Un compte existe déjà avec cet email.';
      case 'operation-not-allowed':
        return 'L\'authentification par email/mot de passe n\'est pas activée.';
      case 'weak-password':
        return 'Le mot de passe est trop faible (minimum 6 caractères).';
      default:
        return 'Erreur : ${e.message}';
    }
  }
}
