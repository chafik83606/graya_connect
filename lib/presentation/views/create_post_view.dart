import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../viewmodels/post_viewmodel.dart';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;

class CreatePostView extends StatefulWidget {
  const CreatePostView({super.key});

  @override
  State<CreatePostView> createState() => _CreatePostViewState();
}

class _CreatePostViewState extends State<CreatePostView> {
  final TextEditingController _contentController = TextEditingController();
  String?
  _imageUrl; // pour l'exemple, on utilisera une URL factice (à remplacer par upload réel)
  bool _isUploading = false;

  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _isUploading = true);
      File imageFile = File(image.path);
      String? downloadUrl = await _uploadImage(imageFile);
      setState(() {
        _imageUrl = downloadUrl;
        _isUploading = false;
      });
      if (downloadUrl == null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Échec du téléchargement de l’image.')),
        );
      }
    }
  }

  Future<String?> _uploadImage(File imageFile) async {
    try {
      String fileName = DateTime.now().millisecondsSinceEpoch.toString();
      firebase_storage.Reference ref = firebase_storage.FirebaseStorage.instance
          .ref()
          .child('posts')
          .child('$fileName.jpg');
      await ref.putFile(imageFile);
      String downloadUrl = await ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      print('Erreur upload: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final postVM = Provider.of<PostViewModel>(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Nouvelle publication')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: 'Que veux-tu partager ?',
                border: OutlineInputBorder(),
              ),
              maxLines: 5,
            ),
            const SizedBox(height: 16),
            if (_imageUrl != null)
              Stack(
                children: [
                  Image.network(_imageUrl!),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      onPressed: () => setState(() => _imageUrl = null),
                    ),
                  ),
                ],
              ),
            if (!_isUploading && _imageUrl == null)
              ElevatedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.image),
                label: const Text('Ajouter une image'),
              ),
            if (_isUploading) const CircularProgressIndicator(),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: postVM.isLoading
                  ? null
                  : () async {
                      if (_contentController.text.trim().isEmpty) return;
                      await postVM.createPost(
                        _contentController.text,
                        imageUrl: _imageUrl,
                      );
                      if (postVM.error == null) {
                        Navigator.pop(context);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Erreur : ${postVM.error}')),
                        );
                      }
                    },
              child: postVM.isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Publier'),
            ),
          ],
        ),
      ),
    );
  }
}
