import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoundIdeaComponent } from './sound-idea.component';

describe('SoundIdeaComponent', () => {
  let component: SoundIdeaComponent;
  let fixture: ComponentFixture<SoundIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoundIdeaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoundIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
