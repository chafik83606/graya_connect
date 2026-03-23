import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'presentation/viewmodels/auth_viewmodel.dart';
import 'presentation/views/login_view.dart';
import 'presentation/views/signup_view.dart';
import 'presentation/views/home_view.dart'; // à créer ensuite
import 'presentation/viewmodels/post_viewmodel.dart';
import 'core/constants/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthViewModel()),
        ChangeNotifierProvider(create: (_) => PostViewModel()),
      ],
      child: MaterialApp(
        title: 'Graya Connect',
        theme: AppTheme.darkTheme,
        initialRoute: '/',
        routes: {
          '/': (context) => Consumer<AuthViewModel>(
            builder: (context, authVM, child) {
              if (authVM.user != null) {
                // Utilisateur connecté → rediriger vers l'accueil
                return const HomeView();
              } else {
                // Non connecté → afficher la page de connexion
                return LoginView();
              }
            },
          ),
          '/login': (context) => LoginView(),
          '/signup': (context) => SignUpView(),
          '/home': (context) => HomeView(),
        },
      ),
    );
  }
}
