import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrategicRelationshipComponent } from './strategic-relationship.component';

describe('StrategicRelationshipComponent', () => {
  let component: StrategicRelationshipComponent;
  let fixture: ComponentFixture<StrategicRelationshipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StrategicRelationshipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StrategicRelationshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
