import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw, SendHorizontal, Sparkles } from 'lucide-react-native';
import { ApiError, assistantApi, errorMessage, type AssistantBlock } from '@/api';
import { IconButton } from '@/components/Button';
import { Chip } from '@/components/Misc';
import { Screen, ScreenHeader } from '@/components/Screen';
import { EmptyView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AiLabel, AssistantBlockView, RichText } from '@/features/assistant/AssistantBlocks';
import { keys } from '@/hooks/queries';
import { colors, spacing } from '@/theme';

interface ChatMessage { id: string; role: 'user' | 'assistant' | 'system'; text: string; blocks?: AssistantBlock[]; ok?: boolean }

const SUGGESTIONS = ['A laptop for university', 'Gifts under $60', "What's in my cart?", 'Where is my order?'];
const WELCOME: ChatMessage = {
  id: 'welcome', role: 'assistant',
  text: "Hi! I'm the Cartify assistant. Tell me what you're looking for — your budget and what it's for — and I'll find matching products. I can also compare products, show your cart and check your orders.",
};

const TYPING: ChatMessage = { id: 'typing', role: 'assistant', text: '' };

// Kept for the app session so leaving and reopening the screen continues the same chat.
let savedConversationId: string | null = null;
let nextId = 0;
const newId = () => `m${++nextId}`;

// 25 · Cartify Assistant (AI shopping assistant)
export default function AssistantScreen() {
  const qc = useQueryClient();
  const list = useRef<FlatList<ChatMessage>>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(savedConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const remember = (id: string | null) => { savedConversationId = id; setConversationId(id); };
  const scrollToEnd = () => setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);

  const load = useCallback(async () => {
    try {
      const status = await assistantApi.status();
      setEnabled(status.enabled);
      if (!status.enabled) return;
    } catch {
      setEnabled(true); // offline: the first message will show the error
    }
    if (savedConversationId) {
      try {
        const h = await assistantApi.conversation(savedConversationId);
        setPending(new Set(h.pendingActions.map((a) => a.actionId)));
        setMessages(h.transcript.map((t) => ({ id: newId(), role: t.role, text: t.text, blocks: t.blocks, ok: t.ok })));
        scrollToEnd();
        return;
      } catch {
        remember(null);
      }
    }
    setMessages([WELCOME]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { id: newId(), role: 'user', text }]);
    scrollToEnd();
    try {
      let res;
      try {
        res = await assistantApi.chat(text, conversationId);
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404 && conversationId)) throw e;
        remember(null); // the old conversation expired or belonged to a guest session before sign-in
        res = await assistantApi.chat(text);
      }
      remember(res.conversationId);
      setPending(new Set(res.pendingActions.map((a) => a.actionId)));
      setMessages((m) => [...m, { id: newId(), role: 'assistant', text: res.reply.text, blocks: res.reply.blocks }]);
    } catch (e) {
      const unavailable = e instanceof ApiError && e.status === 503;
      setMessages((m) => [...m, { id: newId(), role: 'system', ok: false, text: unavailable ? 'The assistant is not available right now. You can still browse and search the store.' : errorMessage(e) }]);
    } finally {
      setBusy(false);
      scrollToEnd();
    }
  };

  const decide = async (actionId: string, decision: 'confirm' | 'cancel') => {
    if (!conversationId) throw new Error('Conversation not found');
    const r = decision === 'confirm' ? await assistantApi.confirm(actionId, conversationId) : await assistantApi.cancel(actionId, conversationId);
    setPending((p) => { const next = new Set(p); next.delete(actionId); return next; });
    if (decision === 'confirm') qc.invalidateQueries({ queryKey: keys.cart });
    return r.result.message;
  };

  const restart = () => { remember(null); setPending(new Set()); setMessages([WELCOME]); };

  const header = (
    <ScreenHeader
      title="Cartify Assistant"
      subtitle="AI shopping help · live prices & stock"
      right={<IconButton label="Start a new conversation" bordered onPress={restart}><RotateCcw size={18} color={colors.ink} /></IconButton>}
    />
  );

  if (enabled === null) return <Screen header={header} scroll={false}><LoadingView /></Screen>;
  if (!enabled) {
    return (
      <Screen header={header} scroll={false}>
        <EmptyView icon={<Sparkles size={30} color={colors.navy} />} title="Assistant unavailable" message="The shopping assistant is not available right now. You can still browse categories and search products." />
      </Screen>
    );
  }

  const footer = (
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      {messages.length <= 1 && !busy ? (
        <View style={styles.suggest}>
          {SUGGESTIONS.map((s) => <Chip key={s} label={s} onPress={() => send(s)} />)}
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <TextField
            value={input}
            onChangeText={setInput}
            placeholder="Ask about products or orders…"
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            maxLength={2000}
            editable={!busy}
          />
        </View>
        <Pressable
          onPress={() => send(input)}
          disabled={busy || !input.trim()}
          style={({ pressed }) => [styles.send, (busy || !input.trim()) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <SendHorizontal size={22} color={colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <Screen header={header} footer={footer} scroll={false}>
      <FlatList
        ref={list}
        data={busy ? [...messages, TYPING] : messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToEnd}
        renderItem={({ item }) => {
          if (item.id === 'typing') return <View style={[styles.bubble, styles.ai]}><Text color={colors.muted}>Looking through the catalog… this can take up to a minute.</Text></View>;
          if (item.role === 'user') return <View style={[styles.bubble, styles.user]}><Text size={15} color={colors.white} lineHeight={21}>{item.text}</Text></View>;
          if (item.role === 'system') {
            return (
              <View style={[styles.sys, item.ok === false && styles.sysFail]}>
                <Text size={13} align="center" color={item.ok === false ? colors.danger : colors.success}>{item.text}</Text>
              </View>
            );
          }
          return (
            <View style={{ gap: 10 }}>
              {item.text ? (
                <View style={[styles.bubble, styles.ai]}>
                  <RichText text={item.text} />
                  {item.id !== 'welcome' ? <AiLabel /> : null}
                </View>
              ) : null}
              {(item.blocks ?? []).map((b, i) => (
                <AssistantBlockView key={i} block={b} onDecide={decide} handled={b.type === 'confirm_action' && !pending.has(b.actionId)} />
              ))}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.screen, paddingBottom: 16, gap: 12 },
  bubble: { maxWidth: '88%', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12 },
  user: { alignSelf: 'flex-end', backgroundColor: colors.navy, borderBottomRightRadius: 6 },
  ai: { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
  sys: { alignSelf: 'center', backgroundColor: colors.successBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  sysFail: { backgroundColor: colors.dangerBg },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.screen, paddingTop: 10, gap: 10 },
  suggest: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8 },
  send: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
