
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub 저장소 이름이 'cosmic-drift'라면 '/cosmic-drift/'로 설정해야 합니다.
  // 이 설정은 배포 시 경로 문제를 방지합니다.
  base: './', 
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
});
