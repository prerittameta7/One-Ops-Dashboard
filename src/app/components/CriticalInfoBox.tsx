import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CircleAlert, Plus, Trash2, X } from 'lucide-react';
import { Bulletin } from '../../types/dashboard';
import { format } from 'date-fns';

interface CriticalInfoBoxProps {
  bulletins: Bulletin[];
  onSave: (message: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CriticalInfoBox({ bulletins, onSave, onDelete }: CriticalInfoBoxProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newMessage.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(newMessage);
      setNewMessage('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error saving bulletin:', error);
      alert('Failed to save bulletin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bulletin?')) return;
    
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting bulletin:', error);
      alert('Failed to delete bulletin');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CircleAlert className="w-5 h-5 text-red-600" />
            Critical Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {isAdding && (
            <div className="space-y-2 p-3 border rounded-lg bg-yellow-50">
              <Textarea
                placeholder="Enter critical information..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewMessage('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!newMessage.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {bulletins.length === 0 && !isAdding && (
            <p className="text-sm text-gray-500 text-center py-8">
              No critical bulletins. Click + to add one.
            </p>
          )}

          {bulletins.map((bulletin) => (
            <div
              key={bulletin.id}
              className="p-3 bg-red-50 border border-red-200 rounded-lg group relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {bulletin.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(bulletin.timestamp), 'MMM dd, yyyy HH:mm')} • {bulletin.createdBy}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(bulletin.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}