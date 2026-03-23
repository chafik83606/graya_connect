import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../viewmodels/post_viewmodel.dart';
import 'create_post_view.dart';

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final authVM = Provider.of<AuthViewModel>(context);
    final postVM = Provider.of<PostViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Graya Connect'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authVM.signOut();
            },
          ),
        ],
      ),
      body: postVM.posts.isEmpty
          ? const Center(child: Text('Aucune publication pour le moment'))
          : ListView.builder(
              itemCount: postVM.posts.length,
              itemBuilder: (context, index) {
                final post = postVM.posts[index];
                return Card(
                  margin: const EdgeInsets.all(8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundImage: post.userPhotoUrl != null
                                  ? NetworkImage(post.userPhotoUrl!)
                                  : null,
                              child: post.userPhotoUrl == null
                                  ? Text(post.userName[0].toUpperCase())
                                  : null,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    post.userName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    _formatDate(post.createdAt),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(post.content),
                        if (post.imageUrl != null) ...[
                          const SizedBox(height: 8),
                          Image.network(post.imageUrl!),
                        ],
                        const SizedBox(height: 8),
                        // Barre de réactions
                        Wrap(
                          children: [
                            _ReactionButton(
                              emoji: '❤️',
                              count: post.reactions['❤️'] ?? 0,
                              onTap: () => postVM.toggleReaction(post.id, '❤️'),
                            ),
                            _ReactionButton(
                              emoji: '😂',
                              count: post.reactions['😂'] ?? 0,
                              onTap: () => postVM.toggleReaction(post.id, '😂'),
                            ),
                            _ReactionButton(
                              emoji: '😮',
                              count: post.reactions['😮'] ?? 0,
                              onTap: () => postVM.toggleReaction(post.id, '😮'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreatePostView()),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute}';
  }
}

class _ReactionButton extends StatelessWidget {
  final String emoji;
  final int count;
  final VoidCallback onTap;

  const _ReactionButton({
    required this.emoji,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 4),
            Text(count.toString()),
          ],
        ),
      ),
    );
  }
}
