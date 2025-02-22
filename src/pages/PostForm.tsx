
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import PhotoUrlDialog from "@/components/PhotoUrlDialog";
import { MediaCarousel } from "@/components/MediaCarousel";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

interface UserPost {
  id: string;
  content: string;
  images: string[];
  video_urls: string[];
  created_at: string;
}

const PostForm = () => {
  const [newPostContent, setNewPostContent] = useState("");
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserPosts(posts || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const handleCreatePost = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar um post",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (editingPost) {
        const { error } = await supabase
          .from("posts")
          .update({
            content: newPostContent,
            images: selectedImages,
            video_urls: selectedVideos,
          })
          .eq("id", editingPost);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Post atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase.from("posts").insert({
          content: newPostContent,
          images: selectedImages,
          video_urls: selectedVideos,
          user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Post criado com sucesso!",
        });
      }

      setNewPostContent("");
      setSelectedImages([]);
      setSelectedVideos([]);
      setEditingPost(null);
      fetchUserPosts();
    } catch (error) {
      console.error("Error with post:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar o post",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (post: UserPost) => {
    setEditingPost(post.id);
    setNewPostContent(post.content);
    setSelectedImages(post.images || []);
    setSelectedVideos(post.video_urls || []);
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Post excluído com sucesso!",
      });

      fetchUserPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir o post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 pt-20 pb-24">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">
                {editingPost ? "Editar post" : "Criar novo post"}
              </h2>
              <Textarea
                placeholder="O que você está pensando?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="mb-4"
                rows={6}
              />
              {(selectedImages.length > 0 || selectedVideos.length > 0) && (
                <div className="mb-4">
                  <MediaCarousel
                    images={selectedImages}
                    videoUrls={selectedVideos}
                    title="Preview"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPhotoDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Foto
                </Button>
                <Button variant="outline" onClick={() => setIsVideoDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Vídeo
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() && !selectedImages.length && !selectedVideos.length}
                >
                  {editingPost ? "Salvar alterações" : "Publicar"}
                </Button>
                {editingPost && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingPost(null);
                      setNewPostContent("");
                      setSelectedImages([]);
                      setSelectedVideos([]);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Seus posts</h3>
            {userPosts.map((post) => (
              <Card key={post.id} className="shadow-sm">
                <CardContent className="pt-6">
                  <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                  {(post.images?.length > 0 || post.video_urls?.length > 0) && (
                    <div className="mb-4">
                      <MediaCarousel
                        images={post.images || []}
                        videoUrls={post.video_urls || []}
                        title={post.content}
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <PhotoUrlDialog
          isOpen={isPhotoDialogOpen}
          onClose={() => setIsPhotoDialogOpen(false)}
          onConfirm={(url) => {
            setSelectedImages([...selectedImages, url]);
          }}
          title="Adicionar foto do Dropbox"
        />

        <PhotoUrlDialog
          isOpen={isVideoDialogOpen}
          onClose={() => setIsVideoDialogOpen(false)}
          onConfirm={(url) => {
            setSelectedVideos([...selectedVideos, url]);
          }}
          title="Adicionar vídeo do Dropbox"
        />
      </div>
      <BottomNav />
    </div>
  );
};

export default PostForm;
