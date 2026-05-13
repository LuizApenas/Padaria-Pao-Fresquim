import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StorageService } from "../../core/services/storage.service";
import { SettingItem } from "../../core/models";

@Component({
  selector: "pf-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css"
})
export class SettingsComponent {
  settings = this.storageService.getSettings();

  constructor(private readonly storageService: StorageService) {}

  toggleSetting(index: number): void {
    this.settings = this.settings.map((setting, currentIndex) =>
      currentIndex === index ? { ...setting, enabled: !setting.enabled } : setting
    );
    this.storageService.saveSettings(this.settings);
  }

  trackByTitle(_: number, item: SettingItem): string {
    return item.title;
  }
}
