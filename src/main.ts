import { Component, OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Task {
  id: number;
  title: string;
  isEditing?: boolean;
}

interface Swimlane {
  id: number;
  title: string;
  tasks: Task[];
  isEditing?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="board" cdkDropList cdkDropListOrientation="horizontal" (cdkDropListDropped)="dropSwimlane($event)">
      <div *ngFor="let swimlane of swimlanes" class="swimlane" cdkDrag>
        <div class="swimlane-header">
          <div *ngIf="!swimlane.isEditing" class="swimlane-title-container">
            <h3 class="swimlane-title" (click)="editSwimlane(swimlane)">{{ swimlane.title }}</h3>
          </div>
          <div *ngIf="swimlane.isEditing" class="swimlane-edit">
            <input
              #titleInput
              [(ngModel)]="swimlane.title"
              (blur)="finishEditingSwimlane(swimlane)"
              (keyup.enter)="finishEditingSwimlane(swimlane)"
              class="edit-input"
              (click)="$event.stopPropagation()"
            >
          </div>
        </div>
        
        <div
          class="task-list"
          cdkDropList
          [cdkDropListData]="swimlane.tasks"
          (cdkDropListDropped)="dropTask($event)"
          [id]="'list-' + swimlane.id"
          [cdkDropListConnectedTo]="getConnectedLists()"
        >
          <div
            *ngFor="let task of swimlane.tasks"
            class="task"
            cdkDrag
          >
            <div *ngIf="!task.isEditing" class="task-content">
              <span (click)="editTask(task)">{{ task.title }}</span>
              <button class="delete-button" (click)="deleteTask(swimlane, task)">×</button>
            </div>
            <div *ngIf="task.isEditing" class="task-edit">
              <input
                #taskInput
                [(ngModel)]="task.title"
                (blur)="finishEditingTask(task)"
                (keyup.enter)="finishEditingTask(task)"
                class="edit-input"
                (click)="$event.stopPropagation()"
              >
            </div>
          </div>
        </div>
        
        <button class="add-button" (click)="addTask(swimlane)">
          + Add a task
        </button>
      </div>

      <div class="swimlane">
        <button class="add-button" (click)="addSwimlane()">
          + Add another list
        </button>
      </div>
    </div>
  `,
})
export class App implements OnInit {
  swimlanes: Swimlane[] = [];
  nextSwimlaneId = 1;
  nextTaskId = 1;

  ngOnInit() {
    this.loadFromLocalStorage();
    if (this.swimlanes.length === 0) {
      // Initialize with default swimlanes if none exist
      this.swimlanes = [
        {
          id: this.nextSwimlaneId++,
          title: 'To Do',
          tasks: [
            { id: this.nextTaskId++, title: 'Task 1' },
            { id: this.nextTaskId++, title: 'Task 2' }
          ]
        },
        {
          id: this.nextSwimlaneId++,
          title: 'In Progress',
          tasks: []
        },
        {
          id: this.nextSwimlaneId++,
          title: 'Done',
          tasks: []
        }
      ];
      this.saveToLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    const savedData = localStorage.getItem('trelloBoard');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.swimlanes = data.swimlanes;
      this.nextSwimlaneId = data.nextSwimlaneId;
      this.nextTaskId = data.nextTaskId;
    }
  }

  private saveToLocalStorage() {
    const data = {
      swimlanes: this.swimlanes,
      nextSwimlaneId: this.nextSwimlaneId,
      nextTaskId: this.nextTaskId
    };
    localStorage.setItem('trelloBoard', JSON.stringify(data));
  }

  getConnectedLists(): string[] {
    return this.swimlanes.map(swimlane => 'list-' + swimlane.id);
  }

  dropSwimlane(event: CdkDragDrop<any>) {
    moveItemInArray(this.swimlanes, event.previousIndex, event.currentIndex);
    this.saveToLocalStorage();
  }

  dropTask(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.saveToLocalStorage();
  }

  addSwimlane() {
    const title = prompt('Enter list title:');
    if (title) {
      this.swimlanes.push({
        id: this.nextSwimlaneId++,
        title,
        tasks: []
      });
      this.saveToLocalStorage();
    }
  }

  addTask(swimlane: Swimlane) {
    const title = prompt('Enter task title:');
    if (title) {
      swimlane.tasks.push({
        id: this.nextTaskId++,
        title
      });
      this.saveToLocalStorage();
    }
  }

  editSwimlane(swimlane: Swimlane) {
    swimlane.isEditing = true;
    setTimeout(() => {
      const input = document.querySelector('.swimlane-edit input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  finishEditingSwimlane(swimlane: Swimlane) {
    swimlane.isEditing = false;
    if (!swimlane.title.trim()) {
      swimlane.title = 'Untitled List';
    }
    this.saveToLocalStorage();
  }

  editTask(task: Task) {
    task.isEditing = true;
    setTimeout(() => {
      const input = document.querySelector('.task-edit input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  finishEditingTask(task: Task) {
    task.isEditing = false;
    if (!task.title.trim()) {
      task.title = 'Untitled Task';
    }
    this.saveToLocalStorage();
  }

  deleteTask(swimlane: Swimlane, task: Task) {
    const index = swimlane.tasks.indexOf(task);
    if (index > -1) {
      swimlane.tasks.splice(index, 1);
      this.saveToLocalStorage();
    }
  }
}

bootstrapApplication(App);