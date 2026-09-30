import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

// In-Memory Fallback Collections
const localUsers = new Map();
const localDocuments = new Map();
const localActions = new Map();
const localChats = new Map();

// Initialize Demo User in Local Store
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123456', 10);

localUsers.set(DEMO_USER_ID, {
  id: DEMO_USER_ID,
  email: 'demo@documind.ai',
  password_hash: DEMO_PASSWORD_HASH,
  name: 'Demo Reviewer',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

export const store = {
  // ================= USERS =================
  async findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();
      if (!error && data) return data;
    }
    for (const user of localUsers.values()) {
      if (user.email.toLowerCase() === cleanEmail) return user;
    }
    return null;
  },

  async findUserById(id) {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    }
    return localUsers.get(id) || null;
  },

  async createUser({ email, password_hash, name }) {
    const cleanEmail = email.toLowerCase().trim();
    const newUser = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      password_hash,
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      if (!error && data) return data;
    }

    localUsers.set(newUser.id, newUser);
    return newUser;
  },

  // ================= DOCUMENTS =================
  async createDocument(docData) {
    const id = docData.id || crypto.randomUUID();
    const record = {
      ...docData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .insert([record])
        .select()
        .single();
      if (!error && data) return data;
    }

    localDocuments.set(id, record);
    return record;
  },

  async getDocumentsByUserId(userId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    }

    const docs = Array.from(localDocuments.values())
      .filter(doc => doc.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return docs;
  },

  async getDocumentById(id, userId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (!error && data) return data;
    }

    const doc = localDocuments.get(id);
    if (doc && doc.user_id === userId) return doc;
    return null;
  },

  async updateDocument(id, userId, updates) {
    const updated_at = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .update({ ...updates, updated_at })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return data;
    }

    const doc = localDocuments.get(id);
    if (doc && doc.user_id === userId) {
      const updated = { ...doc, ...updates, updated_at };
      localDocuments.set(id, updated);
      return updated;
    }
    return null;
  },

  async deleteDocument(id, userId) {
    if (supabase) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (!error) return true;
    }

    const doc = localDocuments.get(id);
    if (doc && doc.user_id === userId) {
      localDocuments.delete(id);
      // clean associated actions and chats
      for (const [actionId, action] of localActions.entries()) {
        if (action.document_id === id) localActions.delete(actionId);
      }
      for (const [chatId, chat] of localChats.entries()) {
        if (chat.document_id === id) localChats.delete(chatId);
      }
      return true;
    }
    return false;
  },

  // ================= ACTION ITEMS (ACTION CENTER) =================
  async createActionItem(item) {
    const id = item.id || crypto.randomUUID();
    const record = {
      ...item,
      id,
      status: item.status || 'pending',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('document_actions')
        .insert([record])
        .select()
        .single();
      if (!error && data) return data;
    }

    localActions.set(id, record);
    return record;
  },

  async getActionItemsByDocument(documentId, userId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('document_actions')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    }

    return Array.from(localActions.values())
      .filter(act => act.document_id === documentId && act.user_id === userId);
  },

  async getAllActionItemsByUserId(userId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('document_actions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    }

    return Array.from(localActions.values())
      .filter(act => act.user_id === userId);
  },

  async updateActionItemStatus(actionId, userId, status) {
    const completed_at = status === 'completed' ? new Date().toISOString() : null;
    if (supabase) {
      const { data, error } = await supabase
        .from('document_actions')
        .update({ status, completed_at })
        .eq('id', actionId)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) return data;
    }

    const action = localActions.get(actionId);
    if (action && action.user_id === userId) {
      const updated = { ...action, status, completed_at };
      localActions.set(actionId, updated);
      return updated;
    }
    return null;
  },

  // ================= GROUNDED CHATS =================
  async saveChatMessage({ documentId, userId, role, content, sourceReferences = [] }) {
    const id = crypto.randomUUID();
    const record = {
      id,
      document_id: documentId,
      user_id: userId,
      role,
      content,
      source_references: sourceReferences,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('document_chats')
        .insert([record])
        .select()
        .single();
      if (!error && data) return data;
    }

    localChats.set(id, record);
    return record;
  },

  async getChatHistory(documentId, userId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('document_chats')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    }

    return Array.from(localChats.values())
      .filter(chat => chat.document_id === documentId && chat.user_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
};
