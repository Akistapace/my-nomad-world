"use client";
import PixelCharacter from "@/components/PixelCharacter";
import { SearchCountry } from "@/components/SearchCountry";
import XPToast from "@/components/XPToast";
import { useUser } from "@/lib/context/user-context";
import { COUNTRIES_CATALOG, CountryOption, countryFlagEmoji } from "@/lib/countries-catalog";
import { COUNTRY_CENTERS } from "@/lib/country-centers";
import { createClient } from "@/lib/supabase/client";
import type { Character, Story } from "@/lib/types";
import { grantXP, type XPResult } from "@/lib/xp";
import { useEffect, useRef, useState } from "react";
import { FaCamera, FaPlus } from "react-icons/fa";
import { FaX } from "react-icons/fa6";

const PAGE_SIZE = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const STORY_GRADIENTS = [
  "linear-gradient(135deg, #0d1b4b, #1a3a7c, #00b4d8)",
  "linear-gradient(135deg, #1a0d2e, #3d1a5c, #bf5af2)",
  "linear-gradient(135deg, #1a1a0d, #3d3a0a, #ffd60a)",
];

const DEFAULT_CHARACTER: Character = {
  skin: "adventurer",
  color: "blue",
  hat: false,
  backpack: false,
};

interface Comment {
  id: string;
  storyId: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export default function StoriesPage() {
  const user = useUser();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Post modal
  const [posting, setPosting] = useState(false);
  const [visitedCodes, setVisitedCodes] = useState<Set<string>>(new Set());
  const [countrySearch, setCountrySearch] = useState("");
  const [form, setForm] = useState({ countryCode: "", countryName: "", caption: "" });
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [xpResult, setXpResult] = useState<XPResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Comments
  const [commentsStoryId, setCommentsStoryId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);

  async function fetchPage(pageNum: number, append = false) {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (!rows || rows.length === 0) {
      if (!append) setLoading(false);
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    const authorIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("users")
      .select("id, username, character")
      .in("id", authorIds);
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    const mapped: Story[] = rows.map((r) => {
      const author = profileMap[r.user_id];
      return {
        id: r.id,
        authorId: r.user_id,
        authorName: author?.username ?? "???",
        authorCharacter: (author?.character as unknown as Character) ?? DEFAULT_CHARACTER,
        image: r.photo_url ?? "",
        caption: r.caption,
        countryCode: r.country_code,
        countryName: r.country_name,
        likes: r.likes,
        createdAt: r.created_at,
        isLiked: false,
      };
    });

    if (append) {
      setStories((prev) => [...prev, ...mapped]);
      setLikedMap((prev) => ({ ...prev, ...Object.fromEntries(mapped.map((s) => [s.id, false])) }));
    } else {
      setStories(mapped);
      setLikedMap(Object.fromEntries(mapped.map((s) => [s.id, false])));
    }

    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    await fetchPage(next, true);
  }

  async function openPostModal() {
    setPosting(true);
    setPostError(null);
    setForm({ countryCode: "", countryName: "", caption: "" });
    setCountrySearch("");
    setSelectedCountry(null);
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("countries")
      .select("code")
      .eq("user_id", user.id)
      .eq("visited", true);
    setVisitedCodes(new Set((data ?? []).map((c) => c.code)));
  }

  function handlePhotoChange(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhoto(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPostError("Formato inválido. Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPostError("Foto muito grande. Máximo 5 MB.");
      return;
    }
    setPostError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handlePost() {
    if (!form.countryCode || !form.caption.trim()) {
      setPostError("Selecione um país e escreva uma legenda.");
      return;
    }
    if (!photo) {
      setPostError("A foto é obrigatória.");
      return;
    }
    setSubmitting(true);
    setPostError(null);
    const supabase = createClient();

    // Auto-register country if user hasn't visited it yet
    if (!visitedCodes.has(form.countryCode)) {
      const meta = COUNTRIES_CATALOG.find((c) => c.code === form.countryCode);
      const flagEmoji = meta ? countryFlagEmoji(meta.alpha2) : "🌍";
      const continent = meta?.continent ?? "";
      const center = COUNTRY_CENTERS[form.countryCode];
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from("countries").insert({
        user_id: user.id,
        code: form.countryCode,
        name: form.countryName,
        flag_emoji: flagEmoji,
        continent,
        visited: true,
        visited_at: today,
      });
      await supabase.from("pins").insert({
        user_id: user.id,
        country_code: form.countryCode,
        type: "travel",
        name: `Visita a ${form.countryName}`,
        lat: center ? center[1] : 0,
        lng: center ? center[0] : 0,
        note: today,
      });
      const result = await grantXP(user.id, 100, user.xp, user.level);
      setXpResult(result);
      setVisitedCodes((prev) => new Set([...prev, form.countryCode]));
      
      // TODO: Adicionar toast avisando de cadastro de novo pais 
    }

    // Upload photo (required)
    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("story-photos")
      .upload(path, photo, { upsert: false, contentType: photo.type });
    if (uploadError) {
      setPostError("Erro ao enviar foto. Tente novamente.");
      setSubmitting(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("story-photos").getPublicUrl(path);
    const photoUrl = urlData.publicUrl;

    const { data } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        country_code: form.countryCode,
        country_name: form.countryName,
        caption: form.caption.trim(),
        likes: 0,
        photo_url: photoUrl,
      })
      .select()
      .single();

    if (data) {
      const newStory: Story = {
        id: data.id,
        authorId: user.id,
        authorName: user.username,
        authorCharacter: user.character,
        image: photoUrl ?? "",
        caption: data.caption,
        countryCode: data.country_code,
        countryName: data.country_name,
        likes: 0,
        createdAt: data.created_at,
        isLiked: false,
      };
      setStories((prev) => [newStory, ...prev]);
      setLikedMap((prev) => ({ [data.id]: false, ...prev }));
    }
    setSubmitting(false);
    setPosting(false);
  }

  const toggleLike = async (id: string) => {
    const supabase = createClient();
    const liked = likedMap[id];
    const current = stories.find((s) => s.id === id)?.likes ?? 0;
    setLikedMap((prev) => ({ ...prev, [id]: !liked }));
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, likes: s.likes + (liked ? -1 : 1) } : s)),
    );
    await supabase
      .from("stories")
      .update({ likes: current + (liked ? -1 : 1) })
      .eq("id", id);
  };

  async function openComments(storyId: string) {
    setCommentsStoryId(storyId);
    setLoadingComments(true);
    setComments([]);
    setCommentText("");
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("story_comments")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });
    if (!rows || rows.length === 0) {
      setLoadingComments(false);
      return;
    }
    const authorIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("users")
      .select("id, username")
      .in("id", authorIds);
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    setComments(
      rows.map((r) => ({
        id: r.id,
        storyId: r.story_id,
        userId: r.user_id,
        authorName: profileMap[r.user_id]?.username ?? "???",
        text: r.text,
        createdAt: r.created_at,
      })),
    );
    setLoadingComments(false);
  }

  async function handlePostComment() {
    if (!commentText.trim() || !commentsStoryId) return;
    setPostingComment(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("story_comments")
      .insert({
        story_id: commentsStoryId,
        user_id: user.id,
        text: commentText.trim(),
      })
      .select()
      .single();
    if (data) {
      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          storyId: data.story_id,
          userId: data.user_id,
          authorName: user.username,
          text: data.text,
          createdAt: data.created_at,
        },
      ]);
      setCommentText("");
    }
    setPostingComment(false);
  }

  if (loading)
    return (
      <div className="page-content flex items-center justify-center min-h-[400px]">
        <div className="text-[10px] text-white blink">CARREGANDO...</div>
      </div>
    );

  const activeStoryIndex = activeStory ? stories.indexOf(activeStory) : 0;

  return (
    <div className="page-content flex flex-col gap-5">
      {xpResult && <XPToast result={xpResult} onDone={() => setXpResult(null)} />}
      <div className="page-header">
        <div className="page-title flex items-center !text-white">
          <FaCamera className="h-5 w-5 text-white mr-4" /> 
          STORIES
        </div>
        <div className="ml-auto text-[8px] text-white">
          {stories.length}
          {hasMore ? "+" : ""} HISTÓRIAS
        </div>
      </div>

      {/* Story circles */}
      <div className="flex gap-[14px] overflow-x-auto pb-2">
        <div
          onClick={openPostModal}
          className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-white bg-[#00e5ff11] flex items-center justify-center text-2xl text-white group-hover:bg-[#00e5ff22] transition-colors">
            <FaPlus />
          </div>
          <span className="text-[6px] text-white">MEU STORY</span>
        </div>
        {stories.map((story, i) => (
          <div
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
          >
            <div
              className="w-16 h-16 flex items-center justify-center overflow-hidden"
              style={{
                border: "2px solid #00e5ff",
                boxShadow: "0 0 8px #00e5ff44",
                background: STORY_GRADIENTS[i % STORY_GRADIENTS.length],
              }}
            >
              {story.image ? (
                <img
                  src={story.image}
                  alt={story.countryName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PixelCharacter character={story.authorCharacter} size={48} />
              )}
            </div>
            <span className="text-[6px] text-white/50 max-w-[64px] text-center overflow-hidden text-ellipsis whitespace-nowrap">
              {story.authorName.slice(0, 9)}
            </span>
          </div>
        ))}
      </div>

      {/* View story modal */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-[#000000cc] z-[100] flex items-center justify-center p-6"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="pixel-panel w-full max-w-[420px] overflow-hidden"
            style={{ borderColor: "#00e5ff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-[18px] py-[14px] border-b border-b-[#29b6f620]">
              <PixelCharacter character={activeStory.authorCharacter} size={40} />
              <div className="flex-1">
                <div className="text-[9px] text-white">{activeStory.authorName}</div>
                <div className="text-[7px] text-white mt-1">
                  {activeStory.countryName} ·{" "}
                  {new Date(activeStory.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="bg-transparent border-none text-white text-lg cursor-pointer leading-none"
              >
                ✕
              </button>
            </div>
            <div
              className="h-[280px] flex items-center justify-center relative overflow-hidden"
              style={{
                background: activeStory.image
                  ? "#000"
                  : STORY_GRADIENTS[activeStoryIndex % STORY_GRADIENTS.length],
              }}
            >
              {activeStory.image ? (
                <img
                  src={activeStory.image}
                  alt={activeStory.countryName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-[52px]">🌍</div>
                  <div className="text-[9px] text-white/50 mt-[10px]">
                    {activeStory.countryName}
                  </div>
                </div>
              )}
              <div className="scanlines absolute inset-0 pointer-events-none" />
            </div>
            <div className="px-4.5 py-4">
              <div className="text-[8px] text-white leading-loose mb-[14px]">
                {activeStory.caption}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleLike(activeStory.id)}
                  className="bg-transparent border-none cursor-pointer text-[20px]"
                  style={{
                    filter: likedMap[activeStory.id] ? "drop-shadow(0 0 6px #ff4d6d)" : "none",
                  }}
                >
                  {likedMap[activeStory.id] ? "❤️" : "🤍"}
                </button>
                <span className="text-[9px] text-white">{activeStory.likes} curtidas</span>
                <button
                  onClick={() => {
                    const id = activeStory.id;
                    setActiveStory(null);
                    openComments(id);
                  }}
                  className="bg-transparent border-none cursor-pointer font-pixel text-[8px] text-white/50 ml-auto"
                >
                  💬 COMENTÁRIOS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments modal */}
      {commentsStoryId && (
        <div
          className="fixed inset-0 bg-[#000000cc] z-[100] flex items-center justify-center p-6"
          onClick={() => setCommentsStoryId(null)}
        >
          <div
            className="pixel-panel w-full max-w-[460px] flex flex-col overflow-hidden"
            style={{ borderColor: "#29b6f6", maxHeight: "80dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pixel-panel-header flex items-center justify-between shrink-0"
              style={{ borderBottomColor: "#29b6f6", color: "#29b6f6" }}
            >
              <span>💬 COMENTÁRIOS</span>
              <button
                onClick={() => setCommentsStoryId(null)}
                className="bg-transparent border-none text-white/40 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 min-h-0">
              {loadingComments && (
                <div className="text-[8px] text-white blink text-center py-4">CARREGANDO...</div>
              )}
              {!loadingComments && comments.length === 0 && (
                <div className="text-[8px] text-white/40 text-center py-6">
                  Nenhum comentário ainda.
                </div>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#01579b] px-4 py-3 border border-[#29b6f622] flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-[#00e5ff]">@{c.authorName}</span>
                    <span className="text-[6px] text-white/30 ml-auto">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="text-[8px] text-white leading-loose">{c.text}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-t-[#29b6f620] p-4 flex gap-2 shrink-0">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                placeholder=""
                maxLength={280}
                className="flex-1 pixel-input"
                style={{ fontSize: 8 }}
              />
              <button
                onClick={handlePostComment}
                disabled={postingComment || !commentText.trim()}
                className="font-pixel text-[7px] px-4 py-2 border-2 border-[#29b6f6] bg-[#29b6f622] text-[#29b6f6] cursor-pointer disabled:opacity-40"
              >
                {postingComment ? "..." : "↵"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post story modal */}
      {posting && (
        <div
          className="fixed inset-0 bg-[#000000cc] z-[100] flex items-center justify-center p-6"
          onClick={() => setPosting(false)}
        >
          <div
            className="pixel-panel w-full max-w-[460px] overflow-y-auto"
            style={{ borderColor: "#bf5af2", maxHeight: "90dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pixel-panel-header flex items-center justify-between border-b-[#bf5af2] text-white">
              <FaCamera className="h-5 w-5" />
              <span className="text-white">NOVO STORY</span>
              <button
                onClick={() => setPosting(false)}
                className="bg-transparent border-none text-white cursor-pointer text-lg leading-none"
              >
                <FaX />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Photo drop zone */}
              <div>
                <div className="text-[7px] text-white mb-2 tracking-[1px] hidden">FOTO</div>
                <div
                  onClick={() => photoRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handlePhotoChange(e.dataTransfer.files[0] ?? null);
                  }}
                  className="h-45 flex items-center justify-center relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed"
                  style={{
                    borderColor: isDragOver ? "#bf5af2" : photoPreview ? "transparent" : "#fff",
                    borderStyle: photoPreview ? "solid" : "dashed",
                    background: photoPreview ? "#000" : isDragOver ? "#bf5af211" : "#0277bd22",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="preview"
                      className="max-h-50 w-full h-full object-contain aspect-square"
                    />
                  ) : (
                    <div className="text-center pointer-events-none">
                      <FaCamera className="h-20 w-20 m-auto" />
                      <div className="text-sm text-white mt-4">arraste ou clique</div>
                    </div>
                  )}
                  <div className="scanlines absolute inset-0 pointer-events-none" />
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>

              {/* Country */}
               <SearchCountry
                search={countrySearch}
                selected={selectedCountry}
                visitedCodes={[...visitedCodes]}
                setSearch={setCountrySearch}
                setSelected={(country) => {
                  setSelectedCountry(country);

                  setForm((f) => ({
                    ...f,
                    countryCode: country?.code ?? "",
                    countryName: country?.name ?? "",
                  }));
                }}
              />

              {/* Caption */}
              <div>
                <div className="text-[7px] text-white mb-2 tracking-[1px]">LEGENDA</div>
                <textarea
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder=""
                  maxLength={280}
                  rows={3}
                  className="w-full pixel-textarea"
                />
                <div className="text-right text-[6px] text-white/30 mt-1">
                  {form.caption.length}/280
                </div>
              </div>

              {postError && (
                <div className="text-[7px] text-[#ff4d6d] border border-[#ff4d6d44] bg-[#ff4d6d11] px-3 py-2">
                  {postError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handlePost}
                  disabled={submitting || !form.countryCode || !form.caption.trim() || !photo}
                  style={{
                    flex: 1,
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 8,
                    padding: "12px",
                    border: "2px solid #bf5af2",
                    background: submitting ? "#bf5af208" : "#bf5af222",
                    color: submitting ? "#bf5af288" : "#bf5af2",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "POSTANDO..." : "◆ PUBLICAR"}
                </button>
                <button
                  onClick={() => setPosting(false)}
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 8,
                    padding: "12px 16px",
                    border: "2px solid #ff4d6d44",
                    background: "transparent",
                    color: "#ff4d6d",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="flex flex-col gap-4 max-w-[720px] mx-auto w-full">
        {stories.map((story, i) => {
          const liked = likedMap[story.id];
          return (
            <div key={story.id} className="pixel-panel overflow-hidden">
              <div className="flex items-center gap-3 px-[18px] py-[14px] border-b border-b-[#29b6f620]">
                <PixelCharacter character={story.authorCharacter} size={40} />
                <div className="flex-1">
                  <div className="text-[9px] text-white">{story.authorName}</div>
                  <div className="text-[7px] text-white/50 mt-1">
                    {story.countryName} · {new Date(story.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <span className="pixel-badge text-[#00e5ff] border-[#00e5ff]">
                  {story.countryCode}
                </span>
              </div>
              <div
                onClick={() => setActiveStory(story)}
                className="h-[220px] flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{
                  background: story.image ? "#000" : STORY_GRADIENTS[i % STORY_GRADIENTS.length],
                }}
              >
                {story.image ? (
                  <img
                    src={story.image}
                    alt={story.countryName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[52px]">🌍</div>
                )}
                <div className="scanlines absolute inset-0 pointer-events-none" />
              </div>
              <div className="px-[18px] py-[14px]">
                <div className="text-[8px] text-white leading-loose mb-[14px]">{story.caption}</div>
                <div className="flex items-center gap-4 border-t border-t-[#29b6f620] pt-3">
                  <button
                    onClick={() => toggleLike(story.id)}
                    className="bg-transparent border-none cursor-pointer flex items-center gap-[6px]"
                    style={{ filter: liked ? "drop-shadow(0 0 4px #ff4d6d)" : "none" }}
                  >
                    <span className="text-lg">{liked ? "❤️" : "🤍"}</span>
                    <span className="font-pixel text-[8px] text-white">{story.likes}</span>
                  </button>
                  <button
                    onClick={() => openComments(story.id)}
                    className="bg-transparent border-none cursor-pointer font-pixel text-[8px] text-white/50"
                  >
                    💬 COMENTAR
                  </button>
                  <button className="bg-transparent border-none cursor-pointer font-pixel text-[8px] text-white/50 ml-auto">
                    ↗ SHARE
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {stories.length === 0 && (
          <div className="text-[8px] text-white/40 text-center py-10">
            Nenhuma história ainda. Seja o primeiro!
          </div>
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full bg-transparent border-2 border-dashed border-[#29b6f6] p-4 text-white font-pixel text-[8px] cursor-pointer disabled:opacity-40"
            onMouseEnter={(e) => {
              if (!loadingMore) {
                e.currentTarget.style.borderColor = "#00e5ff";
                e.currentTarget.style.color = "#00e5ff";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#29b6f6";
              e.currentTarget.style.color = "#fff";
            }}
          >
            {loadingMore ? "CARREGANDO..." : "↓ VER MAIS STORIES"}
          </button>
        )}

        <button
          onClick={openPostModal}
          className="w-full bg-transparent border-2 border-dashed border-[#29b6f6] p-5 text-white font-pixel text-[8px] cursor-pointer"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#bf5af2";
            e.currentTarget.style.color = "#bf5af2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#29b6f6";
            e.currentTarget.style.color = "#fff";
          }}
        >
          POSTAR SEU STORY
        </button>
      </div>
    </div>
  );
}
