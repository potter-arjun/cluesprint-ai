'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, Video, Type, X, FileVideo, Loader2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface SubmissionUploaderProps {
  missionType: string
  onSubmit: (data: { text?: string; files?: File[] }) => Promise<void>
  isSubmitting?: boolean
}

type ActiveTab = 'text' | 'photo' | 'video'

function getDefaultTab(missionType: string): ActiveTab {
  if (missionType === 'discovery') return 'photo'
  if (missionType === 'creative') return 'photo'
  if (missionType === 'puzzle') return 'text'
  if (missionType === 'ai') return 'text'
  return 'text'
}

function getAvailableTabs(missionType: string): ActiveTab[] {
  if (missionType === 'discovery') return ['text', 'photo']
  if (missionType === 'creative') return ['text', 'photo', 'video']
  if (missionType === 'puzzle') return ['text']
  if (missionType === 'ai') return ['text']
  return ['text', 'photo', 'video']
}

export function SubmissionUploader({ missionType, onSubmit, isSubmitting = false }: SubmissionUploaderProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getDefaultTab(missionType))
  const [textContent, setTextContent] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const MAX_CHARS = 500

  const availableTabs = getAvailableTabs(missionType)

  const onDropPhoto = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }, [])

  const onDropVideo = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setVideoFile(file)
  }, [])

  const { getRootProps: getPhotoProps, getInputProps: getPhotoInputProps, isDragActive: isPhotoDrag } = useDropzone({
    onDrop: onDropPhoto,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: isSubmitting,
  })

  const { getRootProps: getVideoProps, getInputProps: getVideoInputProps, isDragActive: isVideoDrag } = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': ['.mp4', '.mov', '.webm', '.avi'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    disabled: isSubmitting,
  })

  function removePhoto() {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  function removeVideo() {
    setVideoFile(null)
  }

  function canSubmit(): boolean {
    if (isSubmitting) return false
    if (activeTab === 'text' && textContent.trim().length > 0) return true
    if (activeTab === 'photo' && photoFile) return true
    if (activeTab === 'video' && videoFile) return true
    return false
  }

  async function handleSubmit() {
    if (!canSubmit()) return
    const files: File[] = []
    if (activeTab === 'photo' && photoFile) files.push(photoFile)
    if (activeTab === 'video' && videoFile) files.push(videoFile)
    await onSubmit({
      text: (activeTab === 'text' && textContent.trim()) ? textContent.trim() : undefined,
      files: files.length > 0 ? files : undefined,
    })
  }

  const tabConfig = {
    text: { icon: Type, label: 'Text' },
    photo: { icon: Camera, label: 'Photo' },
    video: { icon: Video, label: 'Video' },
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className="flex gap-2">
          {availableTabs.map((tab) => {
            const cfg = tabConfig[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                )}
              >
                <cfg.icon className="w-4 h-4" />
                {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {activeTab === 'text' && (
        <div className="space-y-2">
          <Textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Type your answer here..."
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <span className={cn('text-xs', textContent.length > MAX_CHARS * 0.9 ? 'text-amber-400' : 'text-slate-500')}>
              {textContent.length}/{MAX_CHARS}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'photo' && (
        <div>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-lg px-2 py-1">
                <span className="text-white text-xs">{photoFile?.name}</span>
              </div>
            </div>
          ) : (
            <div
              {...getPhotoProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                isPhotoDrag
                  ? 'border-blue-500 bg-blue-600/10'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
              )}
            >
              <input {...getPhotoInputProps()} />
              <Camera className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-300 font-medium">Drop a photo here or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">JPG, PNG, GIF, WEBP</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'video' && (
        <div>
          {videoFile ? (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/40">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{videoFile.name}</p>
                <p className="text-slate-400 text-xs">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button
                onClick={removeVideo}
                className="w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <div
              {...getVideoProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                isVideoDrag
                  ? 'border-violet-500 bg-violet-600/10'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
              )}
            >
              <input {...getVideoInputProps()} />
              <Video className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-300 font-medium">Drop a video or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">MP4, MOV, WEBM up to 100MB</p>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col gap-2">
        <Button
          variant="cyber"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Response
            </>
          )}
        </Button>
        <p className="text-center text-slate-500 text-xs flex items-center justify-center gap-1">
          <Bot className="w-3 h-3" />
          AI will evaluate your submission in real-time
        </p>
      </div>
    </div>
  )
}
