import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SongRequestsService, SongRequest } from '../services/song-requests.service';

@Component({
  standalone: true,
  selector: 'app-songs',
  templateUrl: './songs.page.html',
  styleUrls: ['./songs.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class SongsPage implements OnInit {
  form: FormGroup;
  loading = false;
  submitting = false;
  requests: SongRequest[] = [];

  constructor(
    private fb: FormBuilder,
    private songsService: SongRequestsService,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      artist: [''],
      comment: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(event?: any): void {
    this.loading = !event;
    this.songsService.listMy().subscribe({
      next: (list) => {
        this.requests = list;
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: () => {
        this.loading = false;
        if (event) {
          event.target.complete();
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      return;
    }
    this.submitting = true;
    const payload = this.form.value;
    this.songsService.create(payload).subscribe({
      next: (created) => {
        // Insertamos al inicio para que se vea primero
        this.requests = [created, ...this.requests];
        this.form.reset({ title: '', artist: '', comment: '' });
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}

