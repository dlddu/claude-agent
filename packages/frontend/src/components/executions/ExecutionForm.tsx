/**
 * Execution Creation Form Component
 * @spec UI-001 REQ-1
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { useCreateExecution } from '@/hooks/executions';
import type { CreateExecutionRequest } from '@/services/executionApi';

// Available Claude models
const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
];

// Zod validation schema
const executionFormSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(100000, 'Prompt must be less than 100,000 characters'),
  model: z.string().min(1, 'Model is required'),
  maxTokens: z
    .number()
    .min(1, 'Max tokens must be at least 1')
    .max(100000, 'Max tokens must be at most 100,000'),
  timeout: z
    .number()
    .min(60, 'Timeout must be at least 60 seconds')
    .max(3600, 'Timeout must be at most 3600 seconds'),
  callbackUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  resources: z.object({
    memoryRequest: z.string().optional(),
    memoryLimit: z.string().optional(),
    cpuRequest: z.string().optional(),
    cpuLimit: z.string().optional(),
  }).optional(),
});

type ExecutionFormData = z.infer<typeof executionFormSchema>;

interface MetadataEntry {
  key: string;
  value: string;
}

export interface ExecutionFormProps {
  onSuccess?: (executionId: string) => void;
  onCancel?: () => void;
}

export function ExecutionForm({ onSuccess, onCancel }: ExecutionFormProps) {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [metadata, setMetadata] = useState<MetadataEntry[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ExecutionFormData>({
    resolver: zodResolver(executionFormSchema),
    defaultValues: {
      prompt: '',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      timeout: 1800,
      callbackUrl: '',
      resources: {
        memoryRequest: '',
        memoryLimit: '',
        cpuRequest: '',
        cpuLimit: '',
      },
    },
  });

  const createExecution = useCreateExecution({
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        router.push(`/executions/${data.id}`);
      }
    },
  });

  const onSubmit = (data: ExecutionFormData) => {
    // Build metadata from key-value pairs
    const metadataRecord: Record<string, unknown> = {};
    metadata.forEach((entry) => {
      if (entry.key.trim()) {
        metadataRecord[entry.key.trim()] = entry.value;
      }
    });

    // Build resources (only include non-empty values)
    const resources = data.resources;
    const cleanResources = resources && Object.fromEntries(
      Object.entries(resources).filter(([, v]) => v && v.trim() !== '')
    );

    const request: CreateExecutionRequest = {
      prompt: data.prompt,
      model: data.model,
      maxTokens: data.maxTokens,
      timeout: data.timeout,
      callbackUrl: data.callbackUrl || undefined,
      metadata: Object.keys(metadataRecord).length > 0 ? metadataRecord : undefined,
      resources: cleanResources && Object.keys(cleanResources).length > 0 ? cleanResources : undefined,
    };

    createExecution.mutate(request);
  };

  const handleAddMetadata = () => {
    setMetadata([...metadata, { key: '', value: '' }]);
  };

  const handleRemoveMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const handleMetadataChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metadata];
    updated[index][field] = value;
    setMetadata(updated);
  };

  const promptLength = watch('prompt')?.length || 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt" required>
          Prompt
        </Label>
        <Textarea
          id="prompt"
          placeholder="Enter your prompt for the Claude agent..."
          rows={6}
          {...register('prompt')}
          error={errors.prompt?.message}
        />
        <p className="text-xs text-muted-foreground text-right">
          {promptLength.toLocaleString()} / 100,000 characters
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model" required>
          Model
        </Label>
        <Select
          id="model"
          options={MODEL_OPTIONS}
          {...register('model')}
          error={errors.model?.message}
        />
      </div>

      {/* Max Tokens & Timeout in a row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxTokens" required>
            Max Tokens
          </Label>
          <Input
            id="maxTokens"
            type="number"
            min={1}
            max={100000}
            {...register('maxTokens', { valueAsNumber: true })}
            error={errors.maxTokens?.message}
          />
          <p className="text-xs text-muted-foreground">
            Maximum tokens for response (1 - 100,000)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeout" required>
            Timeout (seconds)
          </Label>
          <Input
            id="timeout"
            type="number"
            min={60}
            max={3600}
            {...register('timeout', { valueAsNumber: true })}
            error={errors.timeout?.message}
          />
          <p className="text-xs text-muted-foreground">
            Execution timeout (60 - 3600 seconds)
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Metadata (optional)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddMetadata}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {metadata.length > 0 ? (
          <div className="space-y-2">
            {metadata.map((entry, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Key"
                  value={entry.key}
                  onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={entry.value}
                  onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMetadata(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No metadata added. Click &quot;Add&quot; to add key-value pairs.
          </p>
        )}
      </div>

      {/* Advanced Options */}
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Advanced Options</span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Callback URL */}
            <div className="space-y-2">
              <Label htmlFor="callbackUrl">Callback URL</Label>
              <Input
                id="callbackUrl"
                type="url"
                placeholder="https://example.com/webhook"
                {...register('callbackUrl')}
                error={errors.callbackUrl?.message}
              />
              <p className="text-xs text-muted-foreground">
                URL to receive completion notifications
              </p>
            </div>

            {/* Resource Settings */}
            <div className="space-y-2">
              <Label>Resource Limits</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memoryRequest" className="text-xs">
                    Memory Request
                  </Label>
                  <Input
                    id="memoryRequest"
                    placeholder="e.g., 256Mi"
                    {...register('resources.memoryRequest')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memoryLimit" className="text-xs">
                    Memory Limit
                  </Label>
                  <Input
                    id="memoryLimit"
                    placeholder="e.g., 512Mi"
                    {...register('resources.memoryLimit')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpuRequest" className="text-xs">
                    CPU Request
                  </Label>
                  <Input
                    id="cpuRequest"
                    placeholder="e.g., 100m"
                    {...register('resources.cpuRequest')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpuLimit" className="text-xs">
                    CPU Limit
                  </Label>
                  <Input
                    id="cpuLimit"
                    placeholder="e.g., 500m"
                    {...register('resources.cpuLimit')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Error Display */}
      {createExecution.error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">
          <p className="text-sm font-medium">Failed to create execution</p>
          <p className="text-sm mt-1">{createExecution.error.message}</p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={createExecution.isPending}>
          Create Execution
        </Button>
      </div>
    </form>
  );
}

export default ExecutionForm;
