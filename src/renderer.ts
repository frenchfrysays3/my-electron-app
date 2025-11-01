interface Song {
  path: string;
  name: string;
}

class MusicPlayer {
  private audioPlayer: HTMLAudioElement;
  private playBtn: HTMLButtonElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private progressBar: HTMLInputElement;
  private volumeBar: HTMLInputElement;
  private currentTimeEl: HTMLElement;
  private durationEl: HTMLElement;
  private songTitle: HTMLElement;
  private songArtist: HTMLElement;
  private playlistItems: HTMLElement;
  private addSongsBtn: HTMLButtonElement;
  
  private playlist: Song[] = [];
  private currentSongIndex: number = -1;
  private isPlaying: boolean = false;

  constructor() {
    this.audioPlayer = document.getElementById('audio-player') as HTMLAudioElement;
    this.playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    this.prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
    this.nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
    this.progressBar = document.getElementById('progress-bar') as HTMLInputElement;
    this.volumeBar = document.getElementById('volume-bar') as HTMLInputElement;
    this.currentTimeEl = document.getElementById('current-time')!;
    this.durationEl = document.getElementById('duration')!;
    this.songTitle = document.getElementById('song-title')!;
    this.songArtist = document.getElementById('song-artist')!;
    this.playlistItems = document.getElementById('playlist-items')!;
    this.addSongsBtn = document.getElementById('add-songs-btn') as HTMLButtonElement;

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.playPrevious());
    this.nextBtn.addEventListener('click', () => this.playNext());
    this.addSongsBtn.addEventListener('click', () => this.addSongs());

    this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
    this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audioPlayer.addEventListener('ended', () => this.playNext());

    this.progressBar.addEventListener('input', (e) => this.seekTo(e));
    this.volumeBar.addEventListener('input', (e) => this.updateVolume(e));

    this.volumeBar.value = '70';
    this.audioPlayer.volume = 0.7;
  }

  private async addSongs(): Promise<void> {
    try {
      const filePaths = await window.electronAPI.selectFile();
      
      filePaths.forEach(filePath => {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown';
        this.playlist.push({ path: filePath, name: fileName });
      });

      this.renderPlaylist();
      
      if (this.currentSongIndex === -1 && this.playlist.length > 0) {
        this.loadSong(0);
      }
    } catch (error) {
      console.error('Failed to add songs:', error);
      // You could add UI feedback here
      this.songTitle.textContent = 'Error adding songs';
      setTimeout(() => {
        this.songTitle.textContent = this.playlist[this.currentSongIndex]?.name || '';
      }, 3000);
    }
  }

  private renderPlaylist(): void {
    this.playlistItems.innerHTML = '';
    
    this.playlist.forEach((song, index) => {
      const li = document.createElement('li');
      li.textContent = song.name;
      li.className = index === this.currentSongIndex ? 'active' : '';
      li.addEventListener('click', () => this.loadSong(index));
      this.playlistItems.appendChild(li);
    });
  }

  private loadSong(index: number): void {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.currentSongIndex = index;
    const song = this.playlist[index];
    if (!song) return;
    
    this.audioPlayer.src = song.path;
    this.songTitle.textContent = song.name;
    this.songArtist.textContent = `Track ${index + 1} of ${this.playlist.length}`;
    
    this.renderPlaylist();
    this.play();
  }

  private togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private play(): void {
    if (this.playlist.length === 0) return;
    
    this.audioPlayer.play();
    this.isPlaying = true;
    this.playBtn.textContent = '⏸️';
  }

  private pause(): void {
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.playBtn.textContent = '▶️';
  }

  private playNext(): void {
    if (this.playlist.length === 0) return;
    
    const nextIndex = (this.currentSongIndex + 1) % this.playlist.length;
    this.loadSong(nextIndex);
  }

  private playPrevious(): void {
    if (this.playlist.length === 0) return;
    
    const prevIndex = this.currentSongIndex - 1 < 0 
      ? this.playlist.length - 1 
      : this.currentSongIndex - 1;
    this.loadSong(prevIndex);
  }

  private updateProgress(): void {
    const current = this.audioPlayer.currentTime;
    const duration = this.audioPlayer.duration;
    
    if (duration) {
      const percentage = (current / duration) * 100;
      this.progressBar.value = percentage.toString();
      this.currentTimeEl.textContent = this.formatTime(current);
    }
  }

  private updateDuration(): void {
    const duration = this.audioPlayer.duration;
    this.durationEl.textContent = this.formatTime(duration);
  }

  private seekTo(e: Event): void {
    const target = e.target as HTMLInputElement;
    const duration = this.audioPlayer.duration;
    const seekTime = (parseFloat(target.value) / 100) * duration;
    this.audioPlayer.currentTime = seekTime;
  }

  private updateVolume(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.audioPlayer.volume = parseFloat(target.value) / 100;
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MusicPlayer();
});