import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BerkusComponent } from './berkus.component';

describe('BerkusComponent', () => {
  let component: BerkusComponent;
  let fixture: ComponentFixture<BerkusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BerkusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BerkusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
