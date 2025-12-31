/**
 * ExecutionForm Component
 * @spec UI-001
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';
import { useCreateExecution } from '@/hooks/executions';
import { cn } from '@/lib/utils';
import type { CreateExecutionRequest } from '@/services/executionApi';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
];

interface ExecutionFormProps {
  className?: string;
}

interface FormData {
  prompt: string;
  model: string;
  maxTokens: number;
  timeout: number;
  callbackUrl: string;
  metadata: Array<{ key: string; value: string }>;
  resources: {
    memoryRequest: string;
    memoryLimit: string;
    cpuRequest: string;
    cpuLimit: string;
  };
}

interface FormErrors {
  prompt?: string;
  maxTokens?: string;
  timeout?: string;
  callbackUrl?: string;
}

const initialFormData: FormData = {
  prompt: '',
  model: DEFAULT_MODEL,
  maxTokens: 4096,
  timeout: 1800,
  callbackUrl: '',
  metadata: [],
  resources: {
    memoryRequest: '',
    memoryLimit: '',
    cpuRequest: '',
    cpuLimit: '',
  },
};

export function ExecutionForm({ className }: ExecutionFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { create, isLoading } = useCreateExecution();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    } else if (formData.prompt.length > 100000) {
      newErrors.prompt = 'Prompt must be less than 100,000 characters';
    }

    if (formData.maxTokens < 1 || formData.maxTokens > 100000) {
      newErrors.maxTokens = 'Max tokens must be between 1 and 100,000';
    }

    if (formData.timeout < 60 || formData.timeout > 3600) {
      newErrors.timeout = 'Timeout must be between 60 and 3600 seconds';
    }

    if (formData.callbackUrl && !isValidUrl(formData.callbackUrl)) {
      newErrors.callbackUrl = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const request: CreateExecutionRequest = {
      prompt: formData.prompt,
      model: formData.model,
      maxTokens: formData.maxTokens,
      timeout: formData.timeout,
      callbackUrl: formData.callbackUrl || undefined,
      metadata:
        formData.metadata.length > 0
          ? Object.fromEntries(
              formData.metadata
                .filter((m) => m.key && m.value)
                .map((m) => [m.key, m.value])
            )
          : undefined,
      resources:
        Object.values(formData.resources).some((v) => v)
          ? {
              cpu: formData.resources.cpuRequest || undefined,
              memory: formData.resources.memoryRequest || undefined,
            }
          : undefined,
    };

    const result = await create(request);

    if (result) {
      toast.success('Execution created successfully');
      router.push(`/executions/${result.id}`);
    } else {
      toast.error('Failed to create execution');
    }
  };

  const addMetadata = () => {
    setFormData((prev) => ({
      ...prev,
      metadata: [...prev.metadata, { key: '', value: '' }],
    }));
  };

  const removeMetadata = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metadata: prev.metadata.filter((_, i) => i !== index),
    }));
  };

  const updateMetadata = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      metadata: prev.metadata.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Main Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prompt: e.target.value }))
              }
              placeholder="Enter your prompt here..."
              rows={6}
              className={cn(
                'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors.prompt && 'border-red-500'
              )}
            />
            {errors.prompt && (
              <p className="mt-1 text-sm text-red-500">{errors.prompt}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.prompt.length.toLocaleString()} / 100,000 characters
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">Model</label>
            <select
              value={formData.model}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, model: e.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Tokens */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Max Tokens
              </label>
              <Input
                type="number"
                value={formData.maxTokens}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxTokens: parseInt(e.target.value) || 0,
                  }))
                }
                min={1}
                max={100000}
                className={cn(errors.maxTokens && 'border-red-500')}
              />
              {errors.maxTokens && (
                <p className="mt-1 text-sm text-red-500">{errors.maxTokens}</p>
              )}
            </div>

            {/* Timeout */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeout: parseInt(e.target.value) || 0,
                  }))
                }
                min={60}
                max={3600}
                className={cn(errors.timeout && 'border-red-500')}
              />
              {errors.timeout && (
                <p className="mt-1 text-sm text-red-500">{errors.timeout}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Advanced Options</CardTitle>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            {/* Callback URL */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Callback URL
              </label>
              <Input
                type="url"
                value={formData.callbackUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    callbackUrl: e.target.value,
                  }))
                }
                placeholder="https://example.com/webhook"
                className={cn(errors.callbackUrl && 'border-red-500')}
              />
              {errors.callbackUrl && (
                <p className="mt-1 text-sm text-red-500">{errors.callbackUrl}</p>
              )}
            </div>

            {/* Resource Configuration */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Resource Configuration
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder="CPU Request (e.g., 500m)"
                  value={formData.resources.cpuRequest}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resources: {
                        ...prev.resources,
                        cpuRequest: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  placeholder="CPU Limit (e.g., 1000m)"
                  value={formData.resources.cpuLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resources: {
                        ...prev.resources,
                        cpuLimit: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  placeholder="Memory Request (e.g., 256Mi)"
                  value={formData.resources.memoryRequest}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resources: {
                        ...prev.resources,
                        memoryRequest: e.target.value,
                      },
                    }))
                  }
                />
                <Input
                  placeholder="Memory Limit (e.g., 512Mi)"
                  value={formData.resources.memoryLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resources: {
                        ...prev.resources,
                        memoryLimit: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            {/* Metadata */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Metadata</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMetadata}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              {formData.metadata.length > 0 ? (
                <div className="space-y-2">
                  {formData.metadata.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Key"
                        value={item.key}
                        onChange={(e) =>
                          updateMetadata(index, 'key', e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) =>
                          updateMetadata(index, 'value', e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMetadata(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No metadata added
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Execution'
          )}
        </Button>
      </div>
    </form>
  );
}

export default ExecutionForm;
