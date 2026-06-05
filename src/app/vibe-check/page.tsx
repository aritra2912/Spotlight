'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Film, 
  ExternalLink, 
  Plus, 
  Video, 
  ThumbsUp, 
  Flame,
  CheckCircle
} from 'lucide-react';
import { mockDb, VibeClip, User, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

export default function VibeCheckFeed() {
  const [clips, setClips] = useState<VibeClip[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  
  // Submit clip form
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadFeedClips = useCallback(() => {
    const list = mockDb.getClips();
    setClips(list);

    const user = mockDb.getActiveUser();
    setCurrentUser(user);

    // Fetch past events that the attendee attended (checked-in) for attribution
    const tkts = mockDb.getTickets().filter(t => t.purchaserId === user.id && t.status === 'checked-in');
    const matchedEventIds = tkts.map(t => t.eventId);
    const evs = mockDb.getEvents().filter(e => matchedEventIds.includes(e.id));
    setPastEvents(evs);
    if (evs.length > 0) setSelectedEventId(evs[0].id);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFeedClips();
    }, 0);

    const handleDbUpdate = () => {
      loadFeedClips();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadFeedClips]);

  if (!currentUser) return null;

  const handleLikeToggle = (clipId: string) => {
    mockDb.toggleLikeClip(clipId);
    loadFeedClips();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleFollowToggle = (creatorId: string) => {
    mockDb.toggleFollowCreator(creatorId);
    loadFeedClips();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleSubmitClip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !caption) return;

    mockDb.submitClip(videoUrl, caption, selectedEventId || undefined);
    
    setSubmitSuccess(true);
    setVideoUrl('');
    setCaption('');
    
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitSuccess(false);
    }, 3000);
    
    loadFeedClips();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 md:py-10 space-y-6">
        
        {/* Head description */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Vibe Check</h2>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/10"
          >
            <Plus className="h-4 w-4" /> Share Highlight
          </button>
        </div>

        {/* Cold-start prompt note */}
        <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-2.5 text-xs text-gray-400 leading-normal">
          <Flame className="h-5 w-5 text-primary shrink-0" />
          <p>
            <strong>Loophole #3 Fix:</strong> Vibe Check cold start is resolved! Attendees can submit post-event highlights. Once approved by the creator, the video goes live in this global discovery feed.
          </p>
        </div>

        {/* Video vertical scrolling deck */}
        <div className="space-y-8">
          {clips.length === 0 ? (
            <div className="text-center py-16 glass-card space-y-2">
              <Film className="h-10 w-10 text-gray-500 mx-auto" />
              <h4 className="font-semibold text-white text-sm">No highlights available</h4>
              <p className="text-xs text-gray-400">Be the first to submit a highlight from a past gig!</p>
            </div>
          ) : (
            clips.map(clip => {
              const isLiked = clip.likedByUserIds.includes(currentUser.id);
              const isFollowing = currentUser.followingCreators.includes(clip.creatorId);
              
              return (
                <div key={clip.id} className="glass-card overflow-hidden flex flex-col space-y-4">
                  {/* YouTube Player aspect ratio */}
                  <div className="relative aspect-[9/16] max-h-[550px] w-full bg-black border-b border-white/5 overflow-hidden">
                    <iframe 
                      src={clip.videoUrl} 
                      title={clip.caption} 
                      className="w-full h-full object-cover"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen 
                    />
                  </div>

                  {/* Actions & Caption panel */}
                  <div className="p-4 pt-0 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 truncate">
                        <h4 className="font-semibold text-white text-sm truncate">{clip.creatorName}</h4>
                        {clip.creatorId !== currentUser.id && (
                          <button
                            onClick={() => handleFollowToggle(clip.creatorId)}
                            className={`py-0.5 px-2 rounded-md border text-[9px] font-bold transition-all ${
                              isFollowing 
                                ? 'bg-white/10 border-white/10 text-white' 
                                : 'bg-primary border-primary text-white hover:bg-primary-hover'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>

                      {/* Right actions toolbar */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Likes */}
                        <button
                          onClick={() => handleLikeToggle(clip.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white"
                        >
                          <ThumbsUp className={`h-4.5 w-4.5 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                          <span>{clip.likes}</span>
                        </button>

                        {/* Link back to event details */}
                        {clip.eventId && (
                          <a
                            href={`/events/${clip.eventId}`}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:text-primary-hover"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Event Info
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-normal italic">
                      &quot;{clip.caption}&quot;
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ATTENDEE HIGHLIGHT SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card p-6 border border-white/10 relative">
            <h4 className="font-display font-extrabold text-base text-white flex items-center gap-1.5 mb-2">
              <Video className="text-primary h-5 w-5 animate-pulse" /> Submit Event Highlights
            </h4>
            
            {submitSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-success mx-auto" />
                <h5 className="font-semibold text-white text-xs font-display">Submission Logged</h5>
                <p className="text-[10px] text-gray-400 leading-normal">
                  The event creator has been notified. The highlight will show in the feed once approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitClip} className="space-y-4">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Attended a great event? Share a short clip! Paste a YouTube URL and describe it.
                </p>

                {pastEvents.length === 0 ? (
                  <div className="p-3 bg-warning/5 border border-warning/20 text-warning text-[10px] rounded-xl leading-normal">
                    You have not checked-in to any past events. Highlights can only be attributed to events you attended.
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Attended Event</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full glass-input text-xs bg-background"
                      required
                    >
                      {pastEvents.map(e => (
                        <option key={e.id} value={e.id} className="bg-background text-white">{e.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Caption Teaser</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Unbelievable punchline from Vimoh!"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="py-1.5 px-3 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pastEvents.length === 0}
                    className="py-1.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-50"
                  >
                    Submit Clip
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
