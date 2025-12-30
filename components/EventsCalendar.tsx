
import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';

// Adicionado igrejaId para satisfazer a interface CalendarEvent
const INITIAL_EVENTS: CalendarEvent[] = [
  { id: '1', igrejaId: 'church-default', titulo: 'Culto de Celebração', descricao: 'Culto especial de domingo', data: new Date().toISOString().split('T')[0], hora: '18:00', local: 'Auditório Principal', cor: 'bg-indigo-500' },
  { id: '2', igrejaId: 'church-default', titulo: 'Reunião de Líderes', descricao: 'Planejamento mensal', data: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], hora: '20:00', local: 'Sala 01', cor: 'bg-orange-500' },
];

const EventsCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    titulo: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    hora: '19:00',
    local: '',
    cor: 'bg-indigo-500'
  });

  // Função para calcular feriados nacionais brasileiros
  const getHolidays = (year: number) => {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    // Feriados Fixos
    const holidays: { [key: string]: string } = {
      [`${year}-01-01`]: 'Ano Novo',
      [`${year}-04-21`]: 'Tiradentes',
      [`${year}-05-01`]: 'Dia do Trabalho',
      [`${year}-09-07`]: 'Independência do Brasil',
      [`${year}-10-12`]: 'Nossa Sra. Aparecida',
      [`${year}-11-02`]: 'Finados',
      [`${year}-11-15`]: 'Proclamação da República',
      [`${year}-11-20`]: 'Consciência Negra',
      [`${year}-12-25`]: 'Natal',
    };

    // Cálculo da Páscoa (Algoritmo de Meeus/Jones/Butcher)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    const easter = new Date(year, month - 1, day);
    
    // Feriados Móveis baseados na Páscoa
    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);
    
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);

    holidays[formatDate(carnival)] = 'Carnaval';
    holidays[formatDate(goodFriday)] = 'Sexta-feira Santa';
    holidays[formatDate(easter)] = 'Páscoa';
    holidays[formatDate(corpusChristi)] = 'Corpus Christi';

    return holidays;
  };

  const holidays = useMemo(() => getHolidays(viewDate.getFullYear()), [viewDate.getFullYear()]);

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const grid = [];
    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
      grid.push({ day: null, date: null });
    }
    // Days of current month
    for (let i = 1; i <= days; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      grid.push({ day: i, date: dateStr });
    }
    return grid;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const navigateMonth = (step: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + step, 1);
    setViewDate(newDate);
  };

  const handleOpenAdd = (date?: string) => {
    setEditingId(null);
    setFormData({
      titulo: '',
      descricao: '',
      data: date || new Date().toISOString().split('T')[0],
      hora: '19:00',
      local: '',
      cor: 'bg-indigo-500'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(event.id);
    setFormData(event);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (editingId && confirm('Deseja realmente excluir este evento?')) {
      setEvents(events.filter(e => e.id !== editingId));
      setIsModalOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setEvents(events.map(ev => ev.id === editingId ? { ...ev, ...formData as CalendarEvent } : ev));
    } else {
      // Adicionado igrejaId ao criar novo evento
      setEvents([...events, { ...formData as CalendarEvent, id: Math.random().toString(36).substr(2, 9), igrejaId: 'church-default' }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendário de Eventos</h1>
          <p className="text-gray-500 text-sm">Organize as atividades e compromissos</p>
        </div>
        <button 
          onClick={() => handleOpenAdd()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Novo Evento
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 capitalize">{monthName}</h2>
          <div className="flex space-x-2">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setViewDate(new Date())} className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Hoje</button>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {calendarGrid.map((item, idx) => {
            const dateStr = item.date;
            const dayEvents = events.filter(e => e.data === dateStr);
            const holidayName = dateStr ? holidays[dateStr] : null;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={idx} 
                onClick={() => dateStr && handleOpenAdd(dateStr)}
                className={`border-r border-b border-gray-50 p-2 transition-colors cursor-pointer hover:bg-gray-50 relative ${!item.day ? 'bg-gray-50/30' : ''} ${holidayName ? 'bg-red-50/50' : ''}`}
              >
                {item.day && (
                  <>
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium ${isToday ? 'bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-gray-500'}`}>
                        {item.day}
                      </span>
                      {holidayName && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-tighter" title={holidayName}>
                          {holidayName}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[75px]">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id}
                          onClick={(e) => handleOpenEdit(event, e)}
                          className={`${event.cor} text-white text-[10px] p-1 rounded truncate font-medium shadow-sm hover:brightness-110`}
                        >
                          {event.hora && <span className="mr-1 font-bold">{event.hora}</span>}
                          {event.titulo}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Título</label>
                <input required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data</label>
                  <input required type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hora</label>
                  <input type="time" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Local</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.local} onChange={(e) => setFormData({...formData, local: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descrição</label>
                <textarea rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cor</label>
                <div className="flex space-x-2">
                  {['bg-indigo-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, cor: color})}
                      className={`w-8 h-8 rounded-full ${color} ${formData.cor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                {editingId && (
                  <button type="button" onClick={handleDelete} className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">Excluir</button>
                )}
                <div className="flex-1"></div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;
