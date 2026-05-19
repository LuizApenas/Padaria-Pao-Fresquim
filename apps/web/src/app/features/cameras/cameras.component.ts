import { CommonModule } from "@angular/common";
import { Component, ElementRef, QueryList, ViewChildren } from "@angular/core";
import { cameras, logs } from "../../core/mock-data";

@Component({
  selector: "pf-cameras",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./cameras.component.html",
  styleUrl: "./cameras.component.css"
})
export class CamerasComponent {
  @ViewChildren("cameraVideo") private readonly cameraVideos?: QueryList<ElementRef<HTMLVideoElement>>;

  isFrozen = false;

  readonly cameraFeeds = [
    {
      title: "Camera loja",
      label: "CAM_02_CHECKOUT",
      status: "online",
      url: "https://jzryonfvdsmnkzkiclpj.supabase.co/storage/v1/object/public/videos/cameras/loja.mp4",
    },
    {
      title: "Camera cozinha",
      label: "CAM_04_KITCHEN",
      status: "online",
      url: "https://jzryonfvdsmnkzkiclpj.supabase.co/storage/v1/object/public/videos/cameras/cozinha.mp4",
    },
    {
      title: "Camera producao",
      label: "CAM_06_PRODUCAO",
      status: "online",
      url: "https://jzryonfvdsmnkzkiclpj.supabase.co/storage/v1/object/public/videos/cameras/producao.mp4",
    },
  ];
  readonly sideCameraFeeds = this.cameraFeeds.slice(1);
  readonly cameras = cameras;
  readonly logs = logs;

  freezeAll(): void {
    this.isFrozen = true;
    this.forEachVideo((video) => video.pause());
  }

  reconnectAll(): void {
    this.isFrozen = false;
    this.forEachVideo((video) => {
      video.load();
      void video.play();
    });
  }

  private forEachVideo(callback: (video: HTMLVideoElement) => void): void {
    this.cameraVideos?.forEach((videoRef) => callback(videoRef.nativeElement));
  }
}
